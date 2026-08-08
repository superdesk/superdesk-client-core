import {test, expect, type Locator} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {pressRepeatedly, restoreDatabaseSnapshot} from './utils';
import {EDITOR3_ACTIVE_BUTTON, getEditor3Field, getEditor3FormattingButton} from './utils/editor3';

test.describe('quote formatting in the article body', () => {
    const HEADLINE = 'quote formatting test';

    // Quote is a block style, so a partial selection converts the whole paragraph. Each
    // paragraph that the case selects "part of" is typed as two halves, so the selection
    // is a fixed number of Shift+ArrowLeft presses.
    const QUOTE_TEXT = 'alpha';
    const REGULAR_TEXT = 'bravo';
    const TO_QUOTE_HEAD = 'charlie';
    const TO_QUOTE_TAIL = 'delta';
    const TO_REGULAR_HEAD = 'echo';
    const TO_REGULAR_TAIL = 'foxtrot';

    const TO_QUOTE_TEXT = TO_QUOTE_HEAD + TO_QUOTE_TAIL;
    const TO_REGULAR_TEXT = TO_REGULAR_HEAD + TO_REGULAR_TAIL;

    /**
     * Draft.js renders every block as the element its block type maps to, tagged with
     * `data-block`. Quote blocks map to `blockquote`, everything typed here otherwise
     * stays an unstyled block, which editor3 renders as a `div`.
     */
    function blockFor(body: Locator, text: string): Locator {
        return body.locator('[data-block="true"]').filter({hasText: text});
    }

    function quoteBlocks(body: Locator): Locator {
        return body.locator('blockquote[data-block="true"]');
    }

    // The italic comes from `.Editor3-editor .Editor3-blockquote`, so it is asserted
    // alongside the tag name: the tag alone would still pass if that rule were dropped
    // and the quote stopped reading as one.
    async function expectQuote(body: Locator, text: string, quoted: boolean): Promise<void> {
        const block = blockFor(body, text);

        await expect(block).toHaveCount(1);
        await expect(block).toHaveJSProperty('tagName', quoted ? 'BLOCKQUOTE' : 'DIV');
        await expect(block).toHaveCSS('font-style', quoted ? 'italic' : 'normal');
    }

    test('toolbar toggle quotes typed text and a selection, and the result survives reopen', {
        annotation: [
            // Partial: only body_html is covered. The case's purpose also names custom text fields,
            // which no snapshot puts on the Story content profile.
            {type: 'confluence', description: '1313669353 partial'}, // Quote
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const authoring = new Authoring(page);
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.createArticleFromDefaultTemplate();

        const headline = page.getByTestId('field--headline').getByRole('textbox');

        await expect(headline).toBeVisible();
        await headline.fill(HEADLINE);
        await expect(headline).toHaveText(HEADLINE);

        const body = getEditor3Field(page, 'body_html');
        const bodyInput = body.getByRole('textbox');
        const quoteButton = getEditor3FormattingButton(body, 'quote');

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();

        await expect(quoteButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expect(quoteBlocks(body)).toHaveCount(0);

        await quoteButton.click();
        await expect(quoteButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expect(quoteBlocks(body)).toHaveCount(1);

        // Typed without repositioning the caret: the text landing in the quote block is
        // what proves the caret stayed inside it.
        await page.keyboard.type(QUOTE_TEXT);
        await expectQuote(body, QUOTE_TEXT, true);

        await page.keyboard.press('Enter');
        await expect(quoteButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expect(quoteBlocks(body)).toHaveCount(2);

        await quoteButton.click();
        await expect(quoteButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expect(quoteBlocks(body)).toHaveCount(1);

        await page.keyboard.type(REGULAR_TEXT);
        await expectQuote(body, REGULAR_TEXT, false);
        await expectQuote(body, QUOTE_TEXT, true);

        await page.keyboard.press('Enter');
        await page.keyboard.type(TO_QUOTE_TEXT);
        await expectQuote(body, TO_QUOTE_TEXT, false);

        // The caret sits at the end of the paragraph; select its second half. Counted
        // arrow presses rather than Home/End, which do not move the caret on macOS.
        await pressRepeatedly(page, 'Shift+ArrowLeft', TO_QUOTE_TAIL.length);

        await expect(quoteButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await quoteButton.click();
        await expect(quoteButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectQuote(body, TO_QUOTE_TEXT, true);
        await expectQuote(body, REGULAR_TEXT, false);

        // Collapse the selection to its end, then split the quote block: the new
        // paragraph inherits the quote style and gives step 8 something to unquote.
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await page.keyboard.type(TO_REGULAR_TEXT);
        await expectQuote(body, TO_REGULAR_TEXT, true);

        await pressRepeatedly(page, 'Shift+ArrowLeft', TO_REGULAR_TAIL.length);

        await expect(quoteButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await quoteButton.click();
        await expect(quoteButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectQuote(body, TO_REGULAR_TEXT, false);
        await expectQuote(body, TO_QUOTE_TEXT, true);

        await authoring.closeAndSave();

        await monitoring.getArticleLocator(HEADLINE).dblclick();
        await expect(bodyInput).toBeVisible();

        await expect(headline).toHaveText(HEADLINE);
        await expect(quoteBlocks(body)).toHaveCount(2);
        await expectQuote(body, QUOTE_TEXT, true);
        await expectQuote(body, REGULAR_TEXT, false);
        await expectQuote(body, TO_QUOTE_TEXT, true);
        await expectQuote(body, TO_REGULAR_TEXT, false);
    });
});
