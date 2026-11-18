import {test, expect, type Page, type Locator} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';

/**
 * QA case "Edit item in new window" (1311835229).
 *
 * The case says "Edit in new window"; the product label is "Edit in new Window".
 */

// The popup loads the whole client a second time.
test.setTimeout(60000);

test.describe('editing an item in a new window', () => {
    const ARTICLE = 'test sports story';
    const ACTION_LABEL = 'Edit in new Window';

    async function openMonitoring(page: Page, label: string = ARTICLE): Promise<Monitoring> {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const item = monitoring.getArticleLocator(label);

        await expect(item).toBeVisible();

        return monitoring;
    }

    async function editInNewWindow(page: Page, monitoring: Monitoring, label: string = ARTICLE): Promise<Page> {
        const menu = await monitoring.openArticleActionsMenu(monitoring.getArticleLocator(label));
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

    function description(authoringPage: Page): Locator {
        return authoringPage.getByTestId('authoring').getByTestId('field--description_text');
    }

    async function saveInPopup(popup: Page): Promise<void> {
        const save = popup.getByTestId('authoring-topbar').getByTestId('save');

        await expect(save).toBeEnabled();

        const [saveResponse] = await Promise.all([
            popup.waitForResponse((response) => /\/api\/archive\/[^/]+$/.test(response.url())
                && response.request().method() === 'PATCH'),
            save.click(),
        ]);

        expect(saveResponse.status()).toBe(200);

        await expect(popup.getByTestId('authoring')).toBeVisible();
        await expect(save).toBeDisabled();
    }

    // The popup calls `window.close()` only after its save/discard and unlock requests
    // resolve (AuthoringWorkspaceService.close), so its closing is the sync point for them.
    async function expectWindowClosed(popup: Page): Promise<void> {
        await expect.poll(() => popup.isClosed(), {timeout: 30000}).toBe(true);
    }

    // Waits for the popup's unlock to land so the reopen does not read the item mid-close.
    async function reopenInOpener(page: Page, monitoring: Monitoring, label: string = ARTICLE): Promise<void> {
        const item = monitoring.getArticleLocator(label);

        await expect(item).toBeVisible();
        await expect(item.getByTestId('article-item-locked')).toHaveCount(0);

        await item.dblclick();
        await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeVisible();
    }

    test('opens the article for editing in a second window and locks it in the list; Cancel returns'
        + ' to the article and Ignore discards the changes', {
        annotation: [
            {type: 'confluence', description: '1311835229 complete'}, // Edit item in new window
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
            {type: 'confluence', description: '1311835229 complete'}, // Edit item in new window
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = await openMonitoring(page);
        const popup = await editInNewWindow(page, monitoring);

        await slugline(popup).fill('saved in new window');
        await setEditor3FieldValue(body(popup).getByRole('textbox'), 'body edited in the new window');
        await saveInPopup(popup);

        await popup.getByTestId('authoring-topbar').getByTestId('close').click();
        await expectWindowClosed(popup);

        await reopenInOpener(page, monitoring);
        await expect(slugline(page)).toHaveValue('saved in new window');

        // editor3 renders its content after the topbar, so a one-shot read would race.
        await expect(body(page)).toContainText('body edited in the new window');
    });

    test('the unsaved changes prompt saves and closes the article when Save is chosen', {
        annotation: [
            {type: 'confluence', description: '1311835229 complete'}, // Edit item in new window
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

    for (const {type, label} of [
        {type: 'picture', label: 'Rivendell picture'},
        {type: 'video', label: 'Isengard video'},
        {type: 'audio', label: 'Lothlorien audio'},
    ]) {
        test(`edits the ${type} item in a second window and locks it in the list; Save keeps it open, Close`
            + ' closes it without a prompt and the change survives a reopen', {
            annotation: [
                {type: 'confluence', description: '1311835229 complete'}, // Edit item in new window
            ],
        }, async ({page}) => {
            await restoreDatabaseSnapshot({snapshotName: 'media-items'});

            const monitoring = await openMonitoring(page, label);
            const popup = await editInNewWindow(page, monitoring, label);
            const edited = `${label} edited in a new window`;

            try {
                const item = monitoring.getArticleLocator(label);

                await expect(item).toBeVisible();
                await expect(item.getByTestId('article-item-locked')).toHaveCount(1);

                const save = popup.getByTestId('authoring-topbar').getByTestId('save');

                await expect(save).toBeDisabled();

                // The description, not the headline: the list labels the item by its headline,
                // which the reopen looks it up by.
                await setEditor3FieldValue(description(popup).getByRole('textbox'), edited);
                await saveInPopup(popup);

                await popup.getByTestId('authoring-topbar').getByTestId('close').click();
                await expectWindowClosed(popup);

                await reopenInOpener(page, monitoring, label);
                await expect(description(page).getByRole('textbox')).toHaveText(edited);
            } finally {
                if (!popup.isClosed()) {
                    await popup.close();
                }
            }
        });
    }
});
