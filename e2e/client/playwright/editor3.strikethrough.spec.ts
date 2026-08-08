import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * Blocked on fixture data, so this spec has never been executed: no e2e snapshot enables
 * `strikethrough` in any editor3 field's `formatOptions` (`main` gives body_html
 * h2, bold, italic, underline, quote, link, embed, media, table), and the editor3 toolbar
 * renders only the configured options, so no strikethrough button exists to drive. There is
 * also no keyboard shortcut for it. Enable the option on the Story content profile in a
 * snapshot, drop the `fixme`, and verify before trusting any of the assertions below.
 */
test.describe('strikethrough formatting in the article body', () => {
    const HEADLINE = 'strikethrough formatting test';

    // Each stretch of text is typed as two halves, so "select part of the text" is
    // a fixed number of Shift+Arrow presses and each half is addressable on its own.
    const STRUCK_HEAD = 'alpha';
    const STRUCK_TAIL = 'bravo';
    const REGULAR_HEAD = 'charlie';
    const REGULAR_TAIL = 'delta';

    const STRUCK_TEXT = STRUCK_HEAD + STRUCK_TAIL;
    const REGULAR_TEXT = REGULAR_HEAD + REGULAR_TAIL;

    const ACTIVE_BUTTON = /Editor3-activeButton/;

    /**
     * Draft.js renders each run of equally styled characters as its own leaf: a span
     * that carries the inline style, wrapping a node with `data-text`. `text-decoration`
     * does not inherit, so the styled span itself has to be asserted on, not the text
     * node inside it.
     */
    function textRun(body: Locator, text: string): Locator {
        return body.locator('[data-text="true"]').filter({hasText: text}).locator('xpath=..');
    }

    async function expectStrikethrough(run: Locator, struck: boolean): Promise<void> {
        await expect(run).toHaveCSS('text-decoration-line', struck ? 'line-through' : 'none');
    }

    async function pressRepeatedly(page: Page, key: string, times: number): Promise<void> {
        for (let i = 0; i < times; i++) {
            await page.keyboard.press(key);
        }
    }

    test.fixme('toolbar toggle strikes typed text and a selection, and the result survives reopen', {
        annotation: [
            // Parked: no snapshot enables the strikethrough format option, so the toolbar button
            // the case is about never renders. See the note above the describe.
            {type: 'confluence', description: '1313669365 parked'}, // Strikethrough
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
        const strikethroughButton = body.getByTestId('toolbar')
            .getByTestId('formatting-option-button')
            .and(page.locator('[data-test-value="strikethrough"]'));

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();

        await expect(strikethroughButton).not.toHaveClass(ACTIVE_BUTTON);
        await strikethroughButton.click();
        await expect(strikethroughButton).toHaveClass(ACTIVE_BUTTON);

        await page.keyboard.type(STRUCK_TEXT);
        await expectStrikethrough(textRun(body, STRUCK_TEXT), true);

        await strikethroughButton.click();
        await expect(strikethroughButton).not.toHaveClass(ACTIVE_BUTTON);

        await page.keyboard.type(REGULAR_TEXT);
        await expectStrikethrough(textRun(body, REGULAR_TEXT), false);
        await expectStrikethrough(textRun(body, STRUCK_TEXT), true);

        // The caret sits at the end of the regular run; select its second half.
        await pressRepeatedly(page, 'Shift+ArrowLeft', REGULAR_TAIL.length);

        await strikethroughButton.click();
        await expect(strikethroughButton).toHaveClass(ACTIVE_BUTTON);
        await expectStrikethrough(textRun(body, REGULAR_TAIL), true);
        await expectStrikethrough(textRun(body, REGULAR_HEAD), false);

        // Collapse the selection to its start, walk back over the regular run and
        // select the second half of the struck run. Counted arrow presses rather than
        // Home/End, which do not move the caret on macOS.
        await page.keyboard.press('ArrowLeft');
        await pressRepeatedly(page, 'ArrowLeft', REGULAR_HEAD.length);
        await pressRepeatedly(page, 'Shift+ArrowLeft', STRUCK_TAIL.length);

        await expect(strikethroughButton).toHaveClass(ACTIVE_BUTTON);
        await strikethroughButton.click();
        await expect(strikethroughButton).not.toHaveClass(ACTIVE_BUTTON);
        await expectStrikethrough(textRun(body, STRUCK_TAIL), false);
        await expectStrikethrough(textRun(body, STRUCK_HEAD), true);

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
        await expectStrikethrough(textRun(body, STRUCK_HEAD), true);
        await expectStrikethrough(textRun(body, STRUCK_TAIL), false);
        await expectStrikethrough(textRun(body, REGULAR_HEAD), false);
        await expectStrikethrough(textRun(body, REGULAR_TAIL), true);
    });
});
