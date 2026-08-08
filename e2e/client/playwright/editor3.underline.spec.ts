import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

test.describe('underline formatting in the article body', () => {
    const HEADLINE = 'underline formatting test';

    // Each stretch of text is typed as two halves, so "select part of the text" is
    // a fixed number of Shift+Arrow presses and each half is addressable on its own.
    const UNDERLINED_HEAD = 'alpha';
    const UNDERLINED_TAIL = 'bravo';
    const REGULAR_HEAD = 'charlie';
    const REGULAR_TAIL = 'delta';

    const UNDERLINED_TEXT = UNDERLINED_HEAD + UNDERLINED_TAIL;
    const REGULAR_TEXT = REGULAR_HEAD + REGULAR_TAIL;

    const ACTIVE_BUTTON = /Editor3-activeButton/;

    /**
     * Draft.js renders each run of equally styled characters as its own leaf: a span
     * that carries the inline style and wraps the node carrying `data-text`. Underline
     * is a `text-decoration`, which does not inherit, so its computed value has to be
     * read off the leaf itself and not off the text node inside it.
     */
    function textRun(body: Locator, text: string): Locator {
        return body.locator('[data-text="true"]').filter({hasText: text}).locator('xpath=..');
    }

    async function expectUnderlined(run: Locator, underlined: boolean): Promise<void> {
        await expect(run).toHaveCSS('text-decoration-line', underlined ? 'underline' : 'none');
    }

    async function pressRepeatedly(page: Page, key: string, times: number): Promise<void> {
        for (let i = 0; i < times; i++) {
            await page.keyboard.press(key);
        }
    }

    test('toolbar toggle underlines typed text and a selection, and the result survives reopen', {
        annotation: [
            // Partial: only body_html is covered. The case's purpose also names custom text fields,
            // which no snapshot puts on the Story content profile.
            {type: 'confluence', description: '1313669372 partial'}, // Underline
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
        const underlineButton = body.getByTestId('toolbar')
            .getByTestId('formatting-option-button')
            .and(page.locator('[data-test-value="underline"]'));

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();

        await expect(underlineButton).not.toHaveClass(ACTIVE_BUTTON);
        await underlineButton.click();
        await expect(underlineButton).toHaveClass(ACTIVE_BUTTON);

        await page.keyboard.type(UNDERLINED_TEXT);
        await expectUnderlined(textRun(body, UNDERLINED_TEXT), true);

        await underlineButton.click();
        await expect(underlineButton).not.toHaveClass(ACTIVE_BUTTON);

        await page.keyboard.type(REGULAR_TEXT);
        await expectUnderlined(textRun(body, REGULAR_TEXT), false);
        await expectUnderlined(textRun(body, UNDERLINED_TEXT), true);

        // The caret sits at the end of the regular run; select its second half.
        await pressRepeatedly(page, 'Shift+ArrowLeft', REGULAR_TAIL.length);

        await underlineButton.click();
        await expect(underlineButton).toHaveClass(ACTIVE_BUTTON);
        await expectUnderlined(textRun(body, REGULAR_TAIL), true);
        await expectUnderlined(textRun(body, REGULAR_HEAD), false);

        // Collapse the selection to its start, walk back over the regular run and
        // select the second half of the underlined run. Counted arrow presses rather
        // than Home/End, which do not move the caret on macOS.
        await page.keyboard.press('ArrowLeft');
        await pressRepeatedly(page, 'ArrowLeft', REGULAR_HEAD.length);
        await pressRepeatedly(page, 'Shift+ArrowLeft', UNDERLINED_TAIL.length);

        await expect(underlineButton).toHaveClass(ACTIVE_BUTTON);
        await underlineButton.click();
        await expect(underlineButton).not.toHaveClass(ACTIVE_BUTTON);
        await expectUnderlined(textRun(body, UNDERLINED_TAIL), false);
        await expectUnderlined(textRun(body, UNDERLINED_HEAD), true);

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
        await expectUnderlined(textRun(body, UNDERLINED_HEAD), true);
        await expectUnderlined(textRun(body, UNDERLINED_TAIL), false);
        await expectUnderlined(textRun(body, REGULAR_HEAD), false);
        await expectUnderlined(textRun(body, REGULAR_TAIL), true);
    });
});
