import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

test.describe('heading formatting in the article body', () => {
    const HEADLINE = 'heading formatting test';

    // Each stretch of text is typed as two halves, so "select part of the text" is
    // a fixed number of Shift+Arrow presses and each half is addressable on its own.
    const TYPED_HEADING = 'alpha';
    const TYPED_REGULAR = 'bravo';
    const HEADING_HEAD = 'charlie';
    const HEADING_TAIL = 'delta';
    const REGULAR_HEAD = 'echo';
    const REGULAR_TAIL = 'foxtrot';

    const ACTIVE_BUTTON = /Editor3-activeButton/;

    // Draft.js renders `header-two` as <h2> and an unstyled paragraph as <div>; both
    // carry `data-block`. Headings are a block style, so they apply to the whole
    // paragraph even when only part of it is selected.
    const HEADING_TAG = 'h2';
    const REGULAR_TAG = 'div';

    function blockWithText(body: Locator, tag: string, text: string): Locator {
        return body.locator(`${tag}[data-block="true"]`).filter({hasText: text});
    }

    async function expectBlockTag(body: Locator, text: string, tag: string): Promise<void> {
        await expect(blockWithText(body, tag, text)).toHaveCount(1);
    }

    async function pressRepeatedly(page: Page, key: string, times: number): Promise<void> {
        for (let i = 0; i < times; i++) {
            await page.keyboard.press(key);
        }
    }

    test('toolbar toggle makes typed text and a selection a heading, and the result survives reopen', {
        annotation: [
            // Partial: only H2 is covered. Every snapshot's content profile enables h2 alone in the
            // body toolbar, so no H1/H3-H6 button renders and those levels cannot be driven from the
            // UI. The case's purpose also names custom text fields, which no snapshot puts on the
            // Story content profile.
            {type: 'confluence', description: '1313669351 partial'}, // Headings H1-H6
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
        const headingButton = body.getByTestId('toolbar')
            .getByTestId('formatting-option-button')
            .and(page.locator(`[data-test-value="${HEADING_TAG}"]`));

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();

        await expect(headingButton).not.toHaveClass(ACTIVE_BUTTON);
        await headingButton.click();
        await expect(headingButton).toHaveClass(ACTIVE_BUTTON);

        await page.keyboard.type(TYPED_HEADING);
        await expectBlockTag(body, TYPED_HEADING, HEADING_TAG);

        await headingButton.click();
        await expect(headingButton).not.toHaveClass(ACTIVE_BUTTON);

        await page.keyboard.type(TYPED_REGULAR);
        await expectBlockTag(body, TYPED_REGULAR, REGULAR_TAG);
        await expect(body.locator(`${HEADING_TAG}[data-block="true"]`)).toHaveCount(0);

        await page.keyboard.press('Enter');

        await headingButton.click();
        await expect(headingButton).toHaveClass(ACTIVE_BUTTON);

        await page.keyboard.type(HEADING_HEAD + HEADING_TAIL);
        await expectBlockTag(body, HEADING_HEAD, HEADING_TAG);

        // The caret sits at the end of the heading; select its second half.
        await pressRepeatedly(page, 'Shift+ArrowLeft', HEADING_TAIL.length);

        await expect(headingButton).toHaveClass(ACTIVE_BUTTON);
        await headingButton.click();
        await expect(headingButton).not.toHaveClass(ACTIVE_BUTTON);
        await expectBlockTag(body, HEADING_TAIL, REGULAR_TAG);
        await expectBlockTag(body, HEADING_HEAD, REGULAR_TAG);

        // Collapse the selection to its end, which is the end of the paragraph, and
        // start a fresh one. Counted arrow presses rather than Home/End, which do not
        // move the caret on macOS.
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');

        await page.keyboard.type(REGULAR_HEAD + REGULAR_TAIL);
        await expectBlockTag(body, REGULAR_HEAD, REGULAR_TAG);

        await pressRepeatedly(page, 'Shift+ArrowLeft', REGULAR_TAIL.length);

        await expect(headingButton).not.toHaveClass(ACTIVE_BUTTON);
        await headingButton.click();
        await expect(headingButton).toHaveClass(ACTIVE_BUTTON);
        await expectBlockTag(body, REGULAR_TAIL, HEADING_TAG);
        await expectBlockTag(body, REGULAR_HEAD, HEADING_TAG);

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
        await expectBlockTag(body, TYPED_HEADING, REGULAR_TAG);
        await expectBlockTag(body, TYPED_REGULAR, REGULAR_TAG);
        await expectBlockTag(body, HEADING_HEAD, REGULAR_TAG);
        await expectBlockTag(body, HEADING_TAIL, REGULAR_TAG);
        await expectBlockTag(body, REGULAR_HEAD, HEADING_TAG);
        await expectBlockTag(body, REGULAR_TAIL, HEADING_TAG);
    });
});
