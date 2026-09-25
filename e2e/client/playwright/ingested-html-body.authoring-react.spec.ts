import {test, expect, Page, Locator} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

// Items that never went through editor3 (ingested, API created) have `body_html` but no
// `fields_meta`. `main` has no such item, so this uses the `ingested-html` record.
test.describe('an article whose body only has HTML (authoring-react)', () => {
    const ITEM_HEADLINE = 'Ingested HTML story';
    const BODY_TEXT = 'Ingested paragraph with bold text.';
    const BODY_MARKUP = '<p>Ingested paragraph with <b>bold</b> text.</p>';

    function getBodyEditor(page: Page): Locator {
        return page.getByTestId('authoring')
            .getByTestId('authoring-field')
            .and(page.locator('[data-test-value="body_html"]'))
            .getByRole('textbox');
    }

    async function openItem(page: Page): Promise<void> {
        await new Monitoring(page).getArticleLocator(ITEM_HEADLINE).dblclick();
        await new Authoring(page).waitForAuthoringReactToInitialize();
    }

    async function expectBodyRendered(editor: Locator): Promise<void> {
        await expect(editor).toContainText(BODY_TEXT);
        await expect(editor).not.toContainText('<b>');

        // Bold renders as a styled span, not a `<b>` tag, so check the font weight.
        await expect(editor.getByText('bold', {exact: true})).toHaveCSS('font-weight', '700');
    }

    test('renders the markup as formatted content and keeps it intact through a save', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'ingested-html'});

        const monitoring = new Monitoring(page);
        const authoring = page.getByTestId('authoring');

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await openItem(page);

        const editor = getBodyEditor(page);

        await expect(editor).not.toContainText(BODY_MARKUP);
        await expectBodyRendered(editor);

        await editor.click();
        await page.keyboard.press('ControlOrMeta+End');
        await page.keyboard.type(' Edited.');

        // Make sure the text landed at the end before checking what was saved.
        await expect(editor).toContainText(`${BODY_TEXT} Edited.`);

        const save = authoring.getByTestId('save');

        await expect(save).toBeEnabled();
        await save.click();
        await expect(save).toBeDisabled();

        await authoring.getByTestId('close').click();
        await expect(authoring).toBeHidden();

        await openItem(page);

        // A bad conversion on read would have saved the markup as escaped text.
        const reopenedEditor = getBodyEditor(page);

        await expectBodyRendered(reopenedEditor);
        await expect(reopenedEditor).toContainText('Edited.');
    });
});
