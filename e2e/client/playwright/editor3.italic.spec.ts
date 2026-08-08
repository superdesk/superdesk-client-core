import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

test.describe('italic formatting in the article body', () => {
    const HEADLINE = 'italic formatting test';

    // Each stretch of text is typed as two halves, so "select part of the text" is
    // a fixed number of Shift+Arrow presses and each half is addressable on its own.
    const ITALIC_HEAD = 'alpha';
    const ITALIC_TAIL = 'bravo';
    const REGULAR_HEAD = 'charlie';
    const REGULAR_TAIL = 'delta';

    const ITALIC_TEXT = ITALIC_HEAD + ITALIC_TAIL;
    const REGULAR_TEXT = REGULAR_HEAD + REGULAR_TAIL;

    const ACTIVE_BUTTON = /Editor3-activeButton/;

    /**
     * Draft.js renders each run of equally styled characters as its own leaf, whose
     * innermost node carries `data-text`. Inline styles sit on the leaf wrapper, so
     * the style computed on the text node reflects them through inheritance.
     */
    function textRun(body: Locator, text: string): Locator {
        return body.locator('[data-text="true"]').filter({hasText: text});
    }

    async function expectItalic(run: Locator, italic: boolean): Promise<void> {
        await expect(run).toHaveCSS('font-style', italic ? 'italic' : 'normal');
    }

    async function pressRepeatedly(page: Page, key: string, times: number): Promise<void> {
        for (let i = 0; i < times; i++) {
            await page.keyboard.press(key);
        }
    }

    test('toolbar toggle italicizes typed text and a selection, and the result survives reopen', {
        annotation: [
            // Partial: only body_html is covered. The case's purpose also names custom text fields,
            // which no snapshot puts on the Story content profile.
            {type: 'confluence', description: '1313669363 partial'}, // Italic
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.createArticleFromDefaultTemplate();

        const headline = page.getByTestId('field--headline').getByRole('textbox');

        await expect(headline).toBeVisible();
        await headline.fill(HEADLINE);
        await expect(headline).toHaveText(HEADLINE);

        const body = page.getByTestId('authoring')
            .getByTestId('authoring-field')
            .and(page.locator('[data-test-value="body_html"]'));
        const bodyInput = body.getByRole('textbox');
        const italicButton = body.getByTestId('toolbar')
            .getByTestId('formatting-option-button')
            .and(page.locator('[data-test-value="italic"]'));

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();

        await expect(italicButton).not.toHaveClass(ACTIVE_BUTTON);
        await italicButton.click();
        await expect(italicButton).toHaveClass(ACTIVE_BUTTON);

        await page.keyboard.type(ITALIC_TEXT);
        await expectItalic(textRun(body, ITALIC_TEXT), true);

        await italicButton.click();
        await expect(italicButton).not.toHaveClass(ACTIVE_BUTTON);

        await page.keyboard.type(REGULAR_TEXT);
        await expectItalic(textRun(body, REGULAR_TEXT), false);
        await expectItalic(textRun(body, ITALIC_TEXT), true);

        // The caret sits at the end of the regular run; select its second half.
        await pressRepeatedly(page, 'Shift+ArrowLeft', REGULAR_TAIL.length);

        await italicButton.click();
        await expect(italicButton).toHaveClass(ACTIVE_BUTTON);
        await expectItalic(textRun(body, REGULAR_TAIL), true);
        await expectItalic(textRun(body, REGULAR_HEAD), false);

        // Collapse the selection to its start, walk back over the regular run and
        // select the second half of the italic run. Counted arrow presses rather than
        // Home/End, which do not move the caret on macOS.
        await page.keyboard.press('ArrowLeft');
        await pressRepeatedly(page, 'ArrowLeft', REGULAR_HEAD.length);
        await pressRepeatedly(page, 'Shift+ArrowLeft', ITALIC_TAIL.length);

        await expect(italicButton).toHaveClass(ACTIVE_BUTTON);
        await italicButton.click();
        await expect(italicButton).not.toHaveClass(ACTIVE_BUTTON);
        await expectItalic(textRun(body, ITALIC_TAIL), false);
        await expectItalic(textRun(body, ITALIC_HEAD), true);

        // Closing an edited article raises the "Save changes?" prompt; saving from
        // there both persists the body and closes the article. Its Save is scoped to
        // the dialog so it does not collide with the topbar Save button.
        await page.getByTestId('authoring-topbar').getByTestId('close').click();
        await page.getByTestId('unsaved-changes-dialog')
            .getByRole('button', {name: 'Save', exact: true})
            .click();
        await expect(page.getByTestId('authoring-topbar')).toBeHidden();

        await monitoring.getArticleLocator(HEADLINE).dblclick();
        await expect(bodyInput).toBeVisible();

        await expect(headline).toHaveText(HEADLINE);
        await expectItalic(textRun(body, ITALIC_HEAD), true);
        await expectItalic(textRun(body, ITALIC_TAIL), false);
        await expectItalic(textRun(body, REGULAR_HEAD), false);
        await expectItalic(textRun(body, REGULAR_TAIL), true);
    });
});
