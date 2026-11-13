import {test, expect, type Page, type Locator} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';

/**
 * QA case "Edit item in new window" (1311835229).
 *
 * Not covered: step 6 repeats the flow for image, audio and video items. The `main`
 * snapshot has only text and composite items, so it needs a media fixture first.
 *
 * The case says "Edit in new window"; the product label is "Edit in new Window".
 */

// Each test loads the whole client a second time in the popup, which has been
// measured past the 30s default when other e2e instances compete for the host.
test.setTimeout(60000);

test.describe('editing an item in a new window', () => {
    const ARTICLE = 'test sports story';
    const ACTION_LABEL = 'Edit in new Window';

    async function openMonitoring(page: Page): Promise<Monitoring> {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const item = monitoring.getArticleLocator(ARTICLE);

        await expect(item).toBeVisible();

        return monitoring;
    }

    async function editInNewWindow(page: Page, monitoring: Monitoring): Promise<Page> {
        const menu = await monitoring.openArticleActionsMenu(monitoring.getArticleLocator(ARTICLE));
        const action = menu.getByRole('button', {name: ACTION_LABEL, exact: true});

        await expect(action).toBeVisible();

        const [popup] = await Promise.all([
            page.waitForEvent('popup'),
            action.click(),
        ]);

        // The popup boots the client from scratch, which outlasts the 15s default.
        await expect(popup.getByTestId('authoring')).toBeVisible({timeout: 30000});

        // Save is shown only while the item is editable, which tells an edit window
        // apart from the read-only "Open in new Window" one.
        await expect(popup.getByTestId('authoring-topbar').getByTestId('save')).toBeVisible();

        return popup;
    }

    function slugline(authoringPage: Page): Locator {
        return authoringPage.getByTestId('authoring').getByTestId('field-slugline');
    }

    function body(authoringPage: Page): Locator {
        return authoringPage.getByTestId('authoring')
            .getByTestId('authoring-field')
            .and(authoringPage.locator('[data-test-value="body_html"]'));
    }

    // The popup calls `window.close()` only after its save/discard and unlock requests
    // resolve (AuthoringWorkspaceService.close), so its closing is the sync point for them.
    async function expectWindowClosed(popup: Page): Promise<void> {
        await expect.poll(() => popup.isClosed(), {timeout: 30000}).toBe(true);
    }

    // The lock indicator clearing shows the popup's unlock has landed, so the reopen
    // does not read the item mid-close.
    async function reopenInOpener(page: Page, monitoring: Monitoring): Promise<void> {
        const item = monitoring.getArticleLocator(ARTICLE);

        await expect(item).toBeVisible();
        await expect(item.getByTestId('article-item-locked')).toHaveCount(0);

        await item.dblclick();
        await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeVisible();
    }

    test('opens the article for editing in a second window and locks it in the list; Cancel returns'
        + ' to the article and Ignore discards the changes', {
        annotation: [
            {type: 'confluence', description: '1311835229 partial'}, // Edit item in new window
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = await openMonitoring(page);
        const popup = await editInNewWindow(page, monitoring);
        const item = monitoring.getArticleLocator(ARTICLE);

        await expect(item).toBeVisible();
        await expect(item.getByTestId('article-item-locked')).toHaveCount(1);

        await expect(slugline(popup)).toHaveValue(ARTICLE);
        await slugline(popup).fill('edited in new window');

        const topbar = popup.getByTestId('authoring-topbar');
        const prompt = popup.getByTestId('unsaved-changes-dialog');

        await topbar.getByTestId('close').click();
        await expect(prompt).toBeVisible();

        await prompt.getByRole('button', {name: 'Cancel', exact: true}).click();
        await expect(prompt).toBeHidden();
        await expect(popup.getByTestId('authoring')).toBeVisible();
        await expect(slugline(popup)).toHaveValue('edited in new window');

        await topbar.getByTestId('close').click();
        await expect(prompt).toBeVisible();

        await prompt.getByRole('button', {name: 'Ignore', exact: true}).click();
        await expectWindowClosed(popup);

        await reopenInOpener(page, monitoring);
        await expect(slugline(page)).toHaveValue(ARTICLE);
    });

    test('Save keeps the article open with Save inactive, Close then closes the window and the'
        + ' saved values survive a reopen', {
        annotation: [
            {type: 'confluence', description: '1311835229 partial'}, // Edit item in new window
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = await openMonitoring(page);
        const popup = await editInNewWindow(page, monitoring);

        const topbar = popup.getByTestId('authoring-topbar');
        const save = topbar.getByTestId('save');

        await slugline(popup).fill('saved in new window');
        await setEditor3FieldValue(body(popup).getByRole('textbox'), 'body edited in the new window');

        await expect(save).toBeEnabled();

        const [saveResponse] = await Promise.all([
            popup.waitForResponse((response) => /\/api\/archive\/[^/]+$/.test(response.url())
                && response.request().method() === 'PATCH'),
            save.click(),
        ]);

        expect(saveResponse.status()).toBe(200);

        await expect(popup.getByTestId('authoring')).toBeVisible();
        await expect(save).toBeDisabled();

        await topbar.getByTestId('close').click();
        await expectWindowClosed(popup);

        await reopenInOpener(page, monitoring);
        await expect(slugline(page)).toHaveValue('saved in new window');

        // editor3 renders its content after the topbar, so a one-shot read would race.
        await expect(body(page)).toContainText('body edited in the new window');
    });

    test('the unsaved changes prompt saves and closes the article when Save is chosen', {
        annotation: [
            {type: 'confluence', description: '1311835229 partial'}, // Edit item in new window
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = await openMonitoring(page);
        const popup = await editInNewWindow(page, monitoring);

        await slugline(popup).fill('saved from the prompt');

        const prompt = popup.getByTestId('unsaved-changes-dialog');

        await popup.getByTestId('authoring-topbar').getByTestId('close').click();
        await expect(prompt).toBeVisible();

        await prompt.getByRole('button', {name: 'Save', exact: true}).click();
        await expectWindowClosed(popup);

        await reopenInOpener(page, monitoring);
        await expect(slugline(page)).toHaveValue('saved from the prompt');
    });
});
