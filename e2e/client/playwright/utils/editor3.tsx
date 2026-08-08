import {Locator, Page, expect} from '@playwright/test';
import {s} from '.';
import {Monitoring} from '../page-object-models/monitoring';

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

const ACTIVE_TOOLBAR_BUTTON = /Editor3-activeButton/;

// Each stretch of text is typed as two halves, so "select part of the text" is
// a fixed number of Shift+Arrow presses and each half is addressable on its own.
const STYLED_HEAD = 'alpha';
const STYLED_TAIL = 'bravo';
const REGULAR_HEAD = 'charlie';
const REGULAR_TAIL = 'delta';

const STYLED_TEXT = STYLED_HEAD + STYLED_TAIL;
const REGULAR_TEXT = REGULAR_HEAD + REGULAR_TAIL;

/**
 * Draft.js renders each run of equally styled characters as its own leaf, whose
 * innermost node carries `data-text`. Inline styles sit on the leaf wrapper, so
 * the style computed on the text node reflects them through inheritance.
 */
export function getEditor3TextRun(field: Locator, text: string): Locator {
    return field.locator('[data-text="true"]').filter({hasText: text});
}

/**
 * Toolbar button of a formatting option, addressed by the `data-test-value` that
 * StyleButton renders (`bold`, `italic`, `underline`, `h2`, `quote`, ...).
 */
export function getEditor3FormattingOptionButton(field: Locator, styleValue: string): Locator {
    return field.getByTestId('toolbar')
        .getByTestId('formatting-option-button')
        .and(field.page().locator(`[data-test-value="${styleValue}"]`));
}

async function pressRepeatedly(page: Page, key: string, times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
        await page.keyboard.press(key);
    }
}

export interface Editor3InlineStyleScenario {
    /** `data-test-value` of the toolbar button under test, e.g. `italic`. */
    styleValue: string;

    /** Headline of the article the scenario creates; keep it unique per spec. */
    headline: string;

    /**
     * Asserts that one run of text carries the style, or does not. Every style has its
     * own computed-style signature, so the caller supplies the check.
     */
    expectStyled(run: Locator, styled: boolean): Promise<void>;
}

/**
 * Drives the inline-formatting QA flow on a new article's body: toggle the style on and
 * type, toggle it off and type again, then flip the style on a selected half of each run,
 * and re-assert all four runs after a save/close/reopen round-trip.
 *
 * Shared because every per-style case (bold, italic, underline, strikethrough, ...) walks
 * this same flow and differs only in the toolbar button and the style asserted, so a fix
 * to the caret arithmetic or the save path is made once here.
 *
 * The caller is responsible for `restoreDatabaseSnapshot()`.
 */
export async function runEditor3InlineStyleScenario(
    page: Page,
    {styleValue, headline, expectStyled}: Editor3InlineStyleScenario,
): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromDefaultTemplate();

    const headlineField = page.getByTestId('field--headline').getByRole('textbox');

    await expect(headlineField).toBeVisible();
    await headlineField.fill(headline);
    await expect(headlineField).toHaveText(headline);

    const body = page.getByTestId('authoring')
        .getByTestId('authoring-field')
        .and(page.locator('[data-test-value="body_html"]'));
    const bodyInput = body.getByRole('textbox');
    const styleButton = getEditor3FormattingOptionButton(body, styleValue);

    await expect(bodyInput).toBeVisible();
    await bodyInput.click();

    await expect(styleButton).not.toHaveClass(ACTIVE_TOOLBAR_BUTTON);
    await styleButton.click();
    await expect(styleButton).toHaveClass(ACTIVE_TOOLBAR_BUTTON);

    await page.keyboard.type(STYLED_TEXT);
    await expectStyled(getEditor3TextRun(body, STYLED_TEXT), true);

    await styleButton.click();
    await expect(styleButton).not.toHaveClass(ACTIVE_TOOLBAR_BUTTON);

    await page.keyboard.type(REGULAR_TEXT);
    await expectStyled(getEditor3TextRun(body, REGULAR_TEXT), false);
    await expectStyled(getEditor3TextRun(body, STYLED_TEXT), true);

    // The caret sits at the end of the regular run; select its second half.
    await pressRepeatedly(page, 'Shift+ArrowLeft', REGULAR_TAIL.length);

    await styleButton.click();
    await expect(styleButton).toHaveClass(ACTIVE_TOOLBAR_BUTTON);
    await expectStyled(getEditor3TextRun(body, REGULAR_TAIL), true);
    await expectStyled(getEditor3TextRun(body, REGULAR_HEAD), false);

    // Collapse the selection to its start, walk back over the regular run and select the
    // second half of the styled run. Counted arrow presses rather than Home/End, which do
    // not move the caret on macOS.
    await page.keyboard.press('ArrowLeft');
    await pressRepeatedly(page, 'ArrowLeft', REGULAR_HEAD.length);
    await pressRepeatedly(page, 'Shift+ArrowLeft', STYLED_TAIL.length);

    await expect(styleButton).toHaveClass(ACTIVE_TOOLBAR_BUTTON);
    await styleButton.click();
    await expect(styleButton).not.toHaveClass(ACTIVE_TOOLBAR_BUTTON);
    await expectStyled(getEditor3TextRun(body, STYLED_TAIL), false);
    await expectStyled(getEditor3TextRun(body, STYLED_HEAD), true);

    // Closing an edited article raises the "Save changes?" prompt; saving from there both
    // persists the body and closes the article. Its Save is scoped to the dialog so it does
    // not collide with the topbar Save button.
    await page.getByTestId('authoring-topbar').getByTestId('close').click();
    await page.getByTestId('unsaved-changes-dialog')
        .getByRole('button', {name: 'Save', exact: true})
        .click();
    await expect(page.getByTestId('authoring-topbar')).toBeHidden();

    await monitoring.getArticleLocator(headline).dblclick();
    await expect(bodyInput).toBeVisible();

    await expect(headlineField).toHaveText(headline);
    await expectStyled(getEditor3TextRun(body, STYLED_HEAD), true);
    await expectStyled(getEditor3TextRun(body, STYLED_TAIL), false);
    await expectStyled(getEditor3TextRun(body, REGULAR_HEAD), false);
    await expectStyled(getEditor3TextRun(body, REGULAR_TAIL), true);
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
