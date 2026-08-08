import {Locator, Page, expect} from '@playwright/test';
import {Authoring} from '../page-object-models/authoring';
import {Monitoring} from '../page-object-models/monitoring';
import {pressRepeatedly} from '../utils';
import {
    EDITOR3_ACTIVE_BUTTON,
    getEditor3Field,
    getEditor3FormattingButton,
    getEditor3TextRun,
} from '../utils/editor3';

// Each stretch of text is typed as two halves, so "select part of the text" is a fixed
// number of Shift+Arrow presses and each half is addressable on its own.
const STYLED_HEAD = 'alpha';
const STYLED_TAIL = 'bravo';
const REGULAR_HEAD = 'charlie';
const REGULAR_TAIL = 'delta';

export interface Editor3InlineStyleScenario {
    /** `data-test-value` of the toolbar formatting button under test, e.g. `italic`. */
    styleName: string;

    /** Headline of the article the scenario creates; keep it unique per spec. */
    headline: string;

    /**
     * Asserts the style is present or absent on one run of text. The locator passed in
     * is the Draft.js leaf, which is the element the inline style is applied to.
     */
    expectStyled: (run: Locator, styled: boolean) => Promise<void>;
}

/**
 * Drives the toolbar inline-style QA flow on a new article's body: toggle the style on
 * and type, toggle it off and type again, then toggle it over selections of
 * already-typed text in both directions, and re-assert all four runs after a
 * save/close/reopen round-trip.
 *
 * Every per-style case (italic, underline, strikethrough, ...) walks this same
 * choreography and differs only in which toolbar button it presses and how the style is
 * read back off the DOM, so a spec supplies just those two. `editor3.bold.spec.ts`
 * predates this module and still carries its own inline copy of the flow.
 *
 * The caller is responsible for `restoreDatabaseSnapshot()`.
 */
export async function runEditor3InlineStyleToggleScenario(
    page: Page,
    {styleName, headline, expectStyled}: Editor3InlineStyleScenario,
): Promise<void> {
    const authoring = new Authoring(page);
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromDefaultTemplate();

    const headlineField = page.getByTestId('field--headline').getByRole('textbox');

    await expect(headlineField).toBeVisible();
    await headlineField.fill(headline);
    await expect(headlineField).toHaveText(headline);

    const body = getEditor3Field(page, 'body_html');
    const bodyInput = body.getByRole('textbox');
    const styleButton = getEditor3FormattingButton(body, styleName);
    const styledText = STYLED_HEAD + STYLED_TAIL;
    const regularText = REGULAR_HEAD + REGULAR_TAIL;
    const run = (text: string) => getEditor3TextRun(body, text);

    await expect(bodyInput).toBeVisible();
    await bodyInput.click();

    await expect(styleButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await styleButton.click();
    await expect(styleButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);

    await page.keyboard.type(styledText);
    await expectStyled(run(styledText), true);

    await styleButton.click();
    await expect(styleButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);

    await page.keyboard.type(regularText);
    await expectStyled(run(regularText), false);
    await expectStyled(run(styledText), true);

    // The caret sits at the end of the regular run; select its second half.
    await pressRepeatedly(page, 'Shift+ArrowLeft', REGULAR_TAIL.length);

    await styleButton.click();
    await expect(styleButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await expectStyled(run(REGULAR_TAIL), true);
    await expectStyled(run(REGULAR_HEAD), false);

    // Collapse the selection to its start, walk back over the regular run and select the
    // second half of the styled run. Counted arrow presses rather than Home/End, which do
    // not move the caret on macOS.
    await page.keyboard.press('ArrowLeft');
    await pressRepeatedly(page, 'ArrowLeft', REGULAR_HEAD.length);
    await pressRepeatedly(page, 'Shift+ArrowLeft', STYLED_TAIL.length);

    await expect(styleButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await styleButton.click();
    await expect(styleButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await expectStyled(run(STYLED_TAIL), false);
    await expectStyled(run(STYLED_HEAD), true);

    await authoring.closeAndSave();

    await monitoring.getArticleLocator(headline).dblclick();
    await expect(bodyInput).toBeVisible();

    await expect(headlineField).toHaveText(headline);
    await expectStyled(run(STYLED_HEAD), true);
    await expectStyled(run(STYLED_TAIL), false);
    await expectStyled(run(REGULAR_HEAD), false);
    await expectStyled(run(REGULAR_TAIL), true);
}
