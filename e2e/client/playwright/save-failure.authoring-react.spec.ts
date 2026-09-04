import {test, expect, type Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test.setTimeout(60000);

const ARTICLE = 'test sports story';
const GROUP = 'Sports / Working Stage';
const HEADLINE_EDITED = 'test sports story edited';

const ARCHIVE_ITEM = '**/api/archive/*';
const AUTOSAVE_CREATE = '**/api/archive_autosave';
const AUTOSAVE_DELETE = '**/api/archive_autosave/*';

function getSaveButton(page: Page) {
    return page.getByTestId('authoring').getByRole('button', {name: 'Save', exact: true});
}

/**
 * Opens the article, replaces the headline by typing and waits until the change has
 * been autosaved on the server.
 *
 * The autosave document is what these tests are about: saving deletes it before writing
 * the article, so whatever the editor does after a failed save it must not keep pointing
 * at it. Filling the field and saving right away (the obvious shortcut) never produces
 * one, because autosave is throttled by 3 seconds and saving cancels it.
 *
 * Further autosaves are blocked from here on. A re-armed autosave would create a new
 * document a few seconds later and repair a stale reference on its own, which would make
 * the tests pass regardless of what the editor kept.
 */
async function openArticleAndAutosaveHeadline(page: Page): Promise<void> {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator(GROUP, ARTICLE),
        'Edit',
    );

    await authoring.waitForAuthoringReactToInitialize();

    const headline = page.getByTestId('authoring')
        .getByTestId('authoring-field')
        .and(page.locator('[data-test-value="headline"]'))
        .getByRole('textbox');

    const autosaveCreated = page.waitForResponse(
        (response) => response.request().method() === 'POST'
            && response.url().endsWith('/archive_autosave')
            && response.ok(),
    );

    await headline.click();
    await headline.press('ControlOrMeta+a');
    await headline.pressSequentially(HEADLINE_EDITED);
    await expect(headline).toHaveText(HEADLINE_EDITED);

    await autosaveCreated;

    await page.route(AUTOSAVE_CREATE, (route) => route.abort());
}

/**
 * Collects the autosave deletions issued from now on.
 *
 * Saving deletes the autosave document, so after a failed save the editor holds no
 * autosave any more and must not ask for that document to be deleted again. The stale
 * request is the only visible trace of the editor still referring to it: the backend
 * answers a repeated delete with 204, so nothing in the UI gives it away, but the
 * reference is wrong and every path that cancels autosave (saving again, closing while
 * discarding changes) sends a request for a document that is not there.
 */
function recordAutosaveDeletions(page: Page): Array<string> {
    const deletions: Array<string> = [];

    page.on('request', (request) => {
        if (request.method() === 'DELETE' && request.url().includes('/archive_autosave/')) {
            deletions.push(request.url());
        }
    });

    return deletions;
}

async function failSaving(page: Page): Promise<void> {
    await page.route(ARCHIVE_ITEM, (route) => {
        if (route.request().method() === 'PATCH') {
            return route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    _status: 'ERR',
                    _issues: {headline: 'empty values not allowed'},
                    _error: {code: 400, message: 'Insertion failure: 1 document(s) contain(s) error(s)'},
                }),
            });
        }

        return route.fallback();
    });

    await getSaveButton(page).click();

    await expect(
        page.getByTestId('notification--error').filter({hasText: 'Item not updated'}),
    ).toBeVisible();

    // the loading overlay must be gone; the Loader component carries no test id
    await expect(page.getByTestId('authoring').locator('.sd-loader')).toHaveCount(0);
}

test.describe('recovering from a failed save (authoring-react)', () => {
    test('saving again after a failure reaches the server and updates the item', async ({page}) => {
        const monitoring = new Monitoring(page);

        await openArticleAndAutosaveHeadline(page);
        await failSaving(page);

        await page.unroute(ARCHIVE_ITEM);

        const autosaveDeletions = recordAutosaveDeletions(page);

        const savePatch = page.waitForRequest(
            (request) => request.method() === 'PATCH' && request.url().includes('/api/archive/'),
        );

        await getSaveButton(page).click();

        // cancelling autosave runs before the article is sent, so by the time the PATCH is
        // out a stale deletion would already have been recorded
        await savePatch;
        expect(autosaveDeletions).toEqual([]);

        // a successful save resets unsaved changes, which disables the save button
        await expect(getSaveButton(page)).toBeDisabled();
        await expect(monitoring.getGroupedArticleLocator(GROUP, HEADLINE_EDITED)).toBeVisible();
    });

    /**
     * The mirror image of the two tests above: there the deletion succeeded and the save failed,
     * here the deletion itself fails, so the document is still on the server and the editor has
     * to keep pointing at it. Both land in the same `catch`.
     */
    test('keeps the autosave reference when it is the deletion that failed', async ({page}) => {
        await openArticleAndAutosaveHeadline(page);

        await page.route(AUTOSAVE_DELETE, (route) => route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({_status: 'ERR', _error: {code: 500, message: 'Internal Server Error'}}),
        }));

        await getSaveButton(page).click();

        await expect(
            page.getByTestId('notification--error').filter({hasText: 'Item not updated'}),
        ).toBeVisible();
        await expect(page.getByTestId('authoring').locator('.sd-loader')).toHaveCount(0);

        await page.unroute(AUTOSAVE_DELETE);

        const autosaveDeletions = recordAutosaveDeletions(page);

        const savePatch = page.waitForRequest(
            (request) => request.method() === 'PATCH' && request.url().includes('/api/archive/'),
        );

        await getSaveButton(page).click();
        await savePatch;

        // the document was never deleted, so the retry has to ask again; dropping the
        // reference would leave it orphaned on the server
        expect(autosaveDeletions.length).toBe(1);
    });

    test('closing and discarding the changes after a failure unlocks and closes the item', async ({page}) => {
        await openArticleAndAutosaveHeadline(page);
        await failSaving(page);

        const autosaveDeletions = recordAutosaveDeletions(page);

        const unlockRequest = page.waitForRequest(
            (request) => request.method() === 'POST' && request.url().includes('/unlock'),
        );

        await page.getByTestId('authoring').getByRole('button', {name: 'Close', exact: true}).click();
        await page.getByTestId('unsaved-changes-dialog').getByRole('button', {name: 'Ignore', exact: true}).click();

        // discarding deletes the autosave document before unlocking, so a stale deletion
        // would already have been recorded once the unlock is out. Nothing catches a
        // rejection on this path, which is what makes a wrong reference dangerous here
        await unlockRequest;
        expect(autosaveDeletions).toEqual([]);

        await expect(page.getByTestId('authoring')).toBeHidden();
    });
});
