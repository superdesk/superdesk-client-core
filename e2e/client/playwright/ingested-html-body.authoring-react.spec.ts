import {test, expect, Page, Locator} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

/**
 * SDESK-7819. Items that never went through editor3 (ingested, API created, legacy editor2)
 * carry `body_html` but no `fields_meta`. The stock `main` snapshot has no item of that shape,
 * which is why this went unnoticed; the `ingested-html` record adds one.
 */
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

        // `<b>` becomes a draft-js BOLD inline style, rendered as a styled span rather
        // than a tag, so assert the computed weight instead of the element.
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

        // Guards the caret placement above: an edit landing mid-sentence would make the
        // post-save assertions fail for a reason that has nothing to do with the fix.
        await expect(editor).toContainText(`${BODY_TEXT} Edited.`);

        const save = authoring.getByTestId('save');

        await expect(save).toBeEnabled();
        await save.click();
        await expect(save).toBeDisabled();

        await authoring.getByTestId('close').click();
        await expect(authoring).toBeHidden();

        await openItem(page);

        // The content state built on read is what the save writes back, so a bad conversion
        // replaces the stored markup with its escaped form on the first save.
        const reopenedEditor = getBodyEditor(page);

        await expectBodyRendered(reopenedEditor);
        await expect(reopenedEditor).toContainText('Edited.');
    });
});
