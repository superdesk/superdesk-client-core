import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * Blocked on fixture data, so this spec has never been executed: no e2e snapshot enables
 * `pre` in any editor3 field's `formatOptions` (`main` gives body_html h2, bold, italic,
 * underline, quote, link, embed, media, table), and the editor3 toolbar renders only the
 * configured options, so no preformatted text button exists to drive. There is also no
 * keyboard shortcut for it. Enable the option on the Story content profile in a snapshot,
 * drop the `fixme`, and verify before trusting any of the assertions below.
 */
test.describe('preformatted text in the article body', () => {
    const HEADLINE = 'preformatted text test';

    // Each stretch of text is typed as two halves, so "select part of the text" is
    // a fixed number of Shift+Arrow presses and each half is addressable on its own.
    const TYPED_PRE = 'alpha';
    const TYPED_REGULAR = 'bravo';
    const PRE_HEAD = 'charlie';
    const PRE_TAIL = 'delta';
    const REGULAR_HEAD = 'echo';
    const REGULAR_TAIL = 'foxtrot';

    const ACTIVE_BUTTON = /Editor3-activeButton/;

    // Draft.js renders `code-block` as <pre> and an unstyled paragraph as <div>; both
    // carry `data-block`. Preformatted is a block style, so it applies to the whole
    // paragraph even when only part of it is selected.
    const PRE_TAG = 'pre';
    const REGULAR_TAG = 'div';

    // The courier rendering the case asks for comes from the family the editor sets on
    // the wrapper around preformatted blocks; the block itself inherits it.
    const MONO_FONT = /Roboto Mono/;

    function blockWithText(body: Locator, tag: string, text: string): Locator {
        return body.locator(`${tag}[data-block="true"]`).filter({hasText: text});
    }

    async function expectPreformatted(body: Locator, text: string, preformatted: boolean): Promise<void> {
        const block = blockWithText(body, preformatted ? PRE_TAG : REGULAR_TAG, text);

        await expect(block).toHaveCount(1);

        if (preformatted) {
            await expect(block).toHaveCSS('font-family', MONO_FONT);
        } else {
            await expect(block).not.toHaveCSS('font-family', MONO_FONT);
        }
    }

    async function pressRepeatedly(page: Page, key: string, times: number): Promise<void> {
        for (let i = 0; i < times; i++) {
            await page.keyboard.press(key);
        }
    }

    test.fixme('toolbar toggle preformats typed text and a selection, and the result survives reopen', {
        annotation: [
            // Parked: no snapshot enables the pre format option, so the toolbar button the case
            // is about never renders. See the note above the describe.
            {type: 'confluence', description: '1313669359 parked'}, // Preformatted text
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
        const preButton = body.getByTestId('toolbar')
            .getByTestId('formatting-option-button')
            .and(page.locator('[data-test-value="pre"]'));

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();

        await expect(preButton).not.toHaveClass(ACTIVE_BUTTON);
        await preButton.click();
        await expect(preButton).toHaveClass(ACTIVE_BUTTON);

        // The empty block under the caret is the one that turned preformatted.
        await expect(body.locator(`${PRE_TAG}[data-block="true"]`)).toHaveCount(1);

        await page.keyboard.type(TYPED_PRE);
        await expectPreformatted(body, TYPED_PRE, true);

        await preButton.click();
        await expect(preButton).not.toHaveClass(ACTIVE_BUTTON);

        await page.keyboard.type(TYPED_REGULAR);
        await expectPreformatted(body, TYPED_REGULAR, false);
        await expect(body.locator(`${PRE_TAG}[data-block="true"]`)).toHaveCount(0);

        await page.keyboard.press('Enter');

        await preButton.click();
        await expect(preButton).toHaveClass(ACTIVE_BUTTON);

        await page.keyboard.type(PRE_HEAD + PRE_TAIL);
        await expectPreformatted(body, PRE_HEAD, true);

        // The caret sits at the end of the preformatted paragraph; select its second half.
        await pressRepeatedly(page, 'Shift+ArrowLeft', PRE_TAIL.length);

        await expect(preButton).toHaveClass(ACTIVE_BUTTON);
        await preButton.click();
        await expect(preButton).not.toHaveClass(ACTIVE_BUTTON);
        await expectPreformatted(body, PRE_TAIL, false);
        await expectPreformatted(body, PRE_HEAD, false);

        // Collapse the selection to its end, which is the end of the paragraph, and
        // start a fresh one. Counted arrow presses rather than Home/End, which do not
        // move the caret on macOS.
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');

        await page.keyboard.type(REGULAR_HEAD + REGULAR_TAIL);
        await expectPreformatted(body, REGULAR_HEAD, false);

        await pressRepeatedly(page, 'Shift+ArrowLeft', REGULAR_TAIL.length);

        await expect(preButton).not.toHaveClass(ACTIVE_BUTTON);
        await preButton.click();
        await expect(preButton).toHaveClass(ACTIVE_BUTTON);
        await expectPreformatted(body, REGULAR_TAIL, true);
        await expectPreformatted(body, REGULAR_HEAD, true);

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
        await expectPreformatted(body, TYPED_PRE, false);
        await expectPreformatted(body, TYPED_REGULAR, false);
        await expectPreformatted(body, PRE_HEAD, false);
        await expectPreformatted(body, PRE_TAIL, false);
        await expectPreformatted(body, REGULAR_HEAD, true);
        await expectPreformatted(body, REGULAR_TAIL, true);
    });
});
