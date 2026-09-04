import {test, expect, type Page, type Locator} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';

/**
 * QA case "Edit item in new window" (1311835229).
 *
 * The monitoring 3-dot menu offers "Edit in new Window", which opens the article
 * for editing in a second browser window. The item is locked while that window is
 * open, closing with unsaved changes raises the Ignore/Cancel/Save prompt, and the
 * saved values survive a reopen.
 *
 * Not covered:
 * - Step 6 repeats the whole flow for image, audio and video items. The `main`
 *   snapshot's archive holds text and composite items only, so no media item is
 *   reachable; covering it needs a media fixture in the snapshot.
 *
 * Wording note: the case calls the action "Edit in new window"; the product label
 * is "Edit in new Window" (`edit.item.popup` in apps/authoring/authoring/index.ts),
 * which is what the assertions use.
 */

// Every test here restores the snapshot and then loads the whole client a second
// time in the popup window. That takes about 10s on an idle machine but has been
// measured past the 30s default with other e2e instances competing for the host.
test.setTimeout(60000);

test.describe('editing an item in a new window', () => {
    const ARTICLE = 'test sports story';
    const ACTION_LABEL = 'Edit in new Window';

    async function openMonitoring(page: Page): Promise<Monitoring> {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const item = monitoring.getArticleLocator(ARTICLE);

        // The list is filled asynchronously after the snapshot restore, so wait for
        // the item before any caller hovers or double clicks it.
        await expect(item).toBeVisible();

        return monitoring;
    }

    /**
     * Runs the documented entry point (3-dot menu > "Edit in new Window") and returns
     * the window it opens, once the article is editable in it.
     */
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

        // The topbar Save button is rendered only when the action is 'edit' (or a
        // correction) and only shown while the item is editable, so its presence is
        // what separates an edit window from the read-only "Open in new Window" one.
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

    /**
     * The popup closes itself through `window.close()` (AuthoringWorkspaceService.close
     * does that whenever `$rootScope.popup` is set), and the close path only reaches it
     * once its own requests have resolved: save or autosave-discard, then unlock.
     * Waiting for the window to be gone is therefore the sync point for those writes.
     */
    async function expectWindowClosed(popup: Page): Promise<void> {
        await expect.poll(() => popup.isClosed(), {timeout: 30000}).toBe(true);
    }

    /**
     * Reopens the article in the window that started the flow. The lock indicator
     * clearing is what tells us this window has processed the popup's unlock, so the
     * reopen reads the item after the close finished rather than mid-flight.
     */
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

        // editor3 renders its content a beat after the topbar is up, so this needs a
        // retrying assertion rather than a one-shot read of the field's paragraphs.
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
