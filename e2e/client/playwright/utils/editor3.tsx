import {Locator, Page, expect} from '@playwright/test';
import {s} from '.';
import {Authoring} from '../page-object-models/authoring';
import {Monitoring} from '../page-object-models/monitoring';

/**
 * Class editor3 puts on a toolbar button whose style is active for the current
 * selection. A pattern rather than a string because `toHaveClass` given a string
 * requires the whole `class` attribute to match, and the button always carries
 * `Editor3-styleButton` next to the active marker.
 */
export const EDITOR3_ACTIVE_BUTTON = /Editor3-activeButton/;

/**
 * The editor3 authoring field for `fieldId` (`body_html`, `abstract`, ...). The field
 * id rides in `data-test-value`, not in a test id, so it cannot be reached by chaining
 * `getByTestId` alone.
 */
export function getEditor3Field(page: Page, fieldId: string): Locator {
    return page.getByTestId('authoring')
        .getByTestId('authoring-field')
        .and(page.locator(`[data-test-value="${fieldId}"]`));
}

/**
 * A toolbar button of the editor3 `field`, addressed by the Superdesk formatting-option
 * id `StyleButton` puts in `data-test-value` (`bold`, `h2`, `quote`, ...). That id is not
 * the tag the block ends up rendered as: the `quote` option renders `blockquote`, and the
 * `pre` option maps to the `code-block` Draft block type, which happens to render as `pre`
 * (see `blockStyles` in scripts/core/editor3/components/toolbar/BlockStyleButtons.tsx).
 */
export function getEditor3FormattingOptionButton(field: Locator, option: string): Locator {
    return field.getByTestId('toolbar')
        .getByTestId('formatting-option-button')
        .and(field.page().locator(`[data-test-value="${option}"]`));
}

/**
 * Presses `key` `times` times. Editor3 specs move and extend the selection with counted
 * arrow presses because Home/End do not move the caret on macOS.
 */
export async function pressRepeatedly(page: Page, key: string, times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
        await page.keyboard.press(key);
    }
}

export function getEditor3Paragraphs(field: Locator): Promise<Array<string>> {
    return field.locator('.DraftEditor-root')
        .first() // there might be multiple roots when working with nested blocks e.g. multi-line-quote
        .locator('[data-contents="true"]')
        .first() // there might be multiple [data-contents] when working with nested blocks e.g. multi-line-quote
        .locator('> *')
        .allInnerTexts()
        .then((items) => items.filter((text) => text.trim().length > 0));
}

export async function getEditor3FormattingOptions(field: Locator): Promise<Array<string>> {
    const locators = await field.locator(s('toolbar', 'formatting-option')).all();

    const result: Array<string> = [];

    for (const locator of locators) {
        const val = await locator.getAttribute('data-test-value');

        if (val != null) {
            result.push(val);
        }
    }

    return result;
}

/**
 * Adds an embed to an editor3 field through the add-embed flow (toolbar Embed >
 * enter URL > submit) and waits for its layout to settle (the iframe onLoad height
 * applied), so a following interaction is not churned by the reflow.
 *
 * `field` is the editor3 field locator (e.g. the body_html authoring-field). The
 * URL is resolved through iframe.ly, so a test that calls this must stub that
 * network (see remove-embed.spec.ts / edit-embed.spec.ts).
 *
 * The flow is fiddly enough to need a single hardened implementation:
 * - EmbedInput's URL field is uncontrolled (read by ref on submit) and the popup
 *   can re-render right after it opens, dropping the typed value. Filling and
 *   verifying as a retried unit re-fills if the value did not stick. Submitting an
 *   empty ref injects a malformed embed that crashes the editor, so the value must
 *   be present before submit.
 * - A new embed renders before its iframe onLoad sets the height (EmbedBlock sets
 *   iframe.height = scrollHeight), and that height change reflows the editor.
 *   Waiting for every embed's iframe to carry a height attribute defers the caller
 *   (e.g. a second add) until that reflow has happened.
 */
export async function addEditor3Embed(field: Locator, url: string): Promise<void> {
    const page = field.page();
    const embedBlocks = field.getByTestId('embed-block');
    const countBefore = await embedBlocks.count();

    await field.getByTestId('toolbar').getByRole('button', {name: 'Embed'}).click();

    const embedForm = page.getByTestId('embed-form');
    const urlInput = embedForm.getByRole('textbox');

    await expect(async () => {
        await urlInput.fill(url);
        await expect(urlInput).toHaveValue(url);
    }).toPass();

    await page.getByTestId('embed-controls').getByTestId('submit').click();
    await expect(embedForm).toBeHidden();

    await expect(embedBlocks).toHaveCount(countBefore + 1);
    await expect(embedBlocks.locator('iframe[height]')).toHaveCount(countBefore + 1);
}

/**
 * Locates a toolbar button of an editor3 field by the formatting option it toggles,
 * e.g. `bold`, `underline`, `italic`.
 */
export function getEditor3FormattingButton(field: Locator, styleName: string): Locator {
    return field.getByTestId('toolbar')
        .getByTestId('formatting-option-button')
        .and(field.page().locator(`[data-test-value="${styleName}"]`));
}

/**
 * Locates the Draft.js leaf holding a run of equally styled characters. Draft renders
 * each run as a span that carries the inline style and wraps the node carrying
 * `data-text`. Assertions read the leaf rather than the text node because a
 * text-level property such as `text-decoration` does not inherit.
 */
export function getEditor3TextRun(field: Locator, text: string): Locator {
    return field.locator('[data-text="true"]').filter({hasText: text}).locator('xpath=..');
}

// Each stretch of text is typed as two halves, so "select part of the text" is a fixed
// number of Shift+Arrow presses and each half is addressable on its own.
const STYLED_HEAD = 'alpha';
const STYLED_TAIL = 'bravo';
const REGULAR_HEAD = 'charlie';
const REGULAR_TAIL = 'delta';

export interface Editor3InlineStyleScenario {
    /** `data-test-value` of the toolbar formatting button under test, e.g. `underline`. */
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
 * Drives the toolbar inline-style case shared by every per-style QA case: toggle the
 * style on and type, toggle it off and type, then toggle it over selections of
 * already-typed text in both directions, and verify the result survives a save and
 * reopen.
 *
 * Bold, underline, italic, strikethrough, sub- and superscript all exercise this same
 * choreography and differ only in which toolbar button they press and how the style is
 * read back off the DOM, so the flow lives here and each spec supplies just those two.
 */
export async function runEditor3InlineStyleToggleScenario(
    page: Page,
    {styleName, headline, expectStyled}: Editor3InlineStyleScenario,
): Promise<void> {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

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

    // Collapse the selection to its start, walk back over the regular run and select
    // the second half of the styled run. Counted arrow presses rather than Home/End,
    // which do not move the caret on macOS.
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

export async function setEditor3FieldValue(locator: Locator, value: string) {
    for (let i = 0; i < 10; i++) {
        await locator.clear();
        await locator.fill(value);

        const currentInputValue = await locator.innerText();

        if (currentInputValue === value) return;
    }

    throw new Error(`Failed to fill input with "${value}" after 10 attempts.`);
}
