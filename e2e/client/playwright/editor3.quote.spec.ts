import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

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

    const ACTIVE_BUTTON = /Editor3-activeButton/;
    const ITALIC = 'italic';

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

    // Regular text is asserted as "not italic" rather than a literal font style: the editor's
    // base font style is a theme value, while a quote block always computes to italic.
    async function expectQuote(body: Locator, text: string, quoted: boolean): Promise<void> {
        const block = blockFor(body, text);

        await expect(block).toHaveCount(1);
        await expect(block).toHaveJSProperty('tagName', quoted ? 'BLOCKQUOTE' : 'DIV');

        if (quoted) {
            await expect(block).toHaveCSS('font-style', ITALIC);
        } else {
            await expect(block).not.toHaveCSS('font-style', ITALIC);
        }
    }

    async function pressRepeatedly(page: Page, key: string, times: number): Promise<void> {
        for (let i = 0; i < times; i++) {
            await page.keyboard.press(key);
        }
    }

    test('toolbar toggle quotes typed text and a selection, and the result survives reopen', {
        annotation: [
            {type: 'confluence', description: '1313669353 complete'}, // Quote
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
        const quoteButton = body.getByTestId('toolbar')
            .getByTestId('formatting-option-button')
            .and(page.locator('[data-test-value="quote"]'));

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();

        await expect(quoteButton).not.toHaveClass(ACTIVE_BUTTON);
        await expect(quoteBlocks(body)).toHaveCount(0);

        await quoteButton.click();
        await expect(quoteButton).toHaveClass(ACTIVE_BUTTON);
        await expect(quoteBlocks(body)).toHaveCount(1);

        // Typed without repositioning the caret: the text landing in the quote block is
        // what proves the caret stayed inside it.
        await page.keyboard.type(QUOTE_TEXT);
        await expectQuote(body, QUOTE_TEXT, true);

        await page.keyboard.press('Enter');
        await expect(quoteButton).toHaveClass(ACTIVE_BUTTON);
        await expect(quoteBlocks(body)).toHaveCount(2);

        await quoteButton.click();
        await expect(quoteButton).not.toHaveClass(ACTIVE_BUTTON);
        await expect(quoteBlocks(body)).toHaveCount(1);

        await page.keyboard.type(REGULAR_TEXT);
        await expectQuote(body, REGULAR_TEXT, false);
        await expectQuote(body, QUOTE_TEXT, true);

        await page.keyboard.press('Enter');
        await page.keyboard.type(TO_QUOTE_TEXT);
        await expectQuote(body, TO_QUOTE_TEXT, false);

        // The caret sits at the end of the paragraph; select its second half.
        await pressRepeatedly(page, 'Shift+ArrowLeft', TO_QUOTE_TAIL.length);

        await expect(quoteButton).not.toHaveClass(ACTIVE_BUTTON);
        await quoteButton.click();
        await expect(quoteButton).toHaveClass(ACTIVE_BUTTON);
        await expectQuote(body, TO_QUOTE_TEXT, true);
        await expectQuote(body, REGULAR_TEXT, false);

        // Collapse the selection to its end, then split the quote block: the new
        // paragraph inherits the quote style and gives step 8 something to unquote.
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await page.keyboard.type(TO_REGULAR_TEXT);
        await expectQuote(body, TO_REGULAR_TEXT, true);

        await pressRepeatedly(page, 'Shift+ArrowLeft', TO_REGULAR_TAIL.length);

        await expect(quoteButton).toHaveClass(ACTIVE_BUTTON);
        await quoteButton.click();
        await expect(quoteButton).not.toHaveClass(ACTIVE_BUTTON);
        await expectQuote(body, TO_REGULAR_TEXT, false);
        await expectQuote(body, TO_QUOTE_TEXT, true);

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
        await expect(quoteBlocks(body)).toHaveCount(2);
        await expectQuote(body, QUOTE_TEXT, true);
        await expectQuote(body, REGULAR_TEXT, false);
        await expectQuote(body, TO_QUOTE_TEXT, true);
        await expectQuote(body, TO_REGULAR_TEXT, false);
    });
});
