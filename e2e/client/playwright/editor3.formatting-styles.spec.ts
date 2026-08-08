import {test, expect, type Locator, type Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {runEditor3InlineStyleToggleScenario} from './scenarios/editor3-inline-style';
import {dismissSessionExpiry, pressRepeatedly, restoreDatabaseSnapshot} from './utils';
import {
    EDITOR3_ACTIVE_BUTTON,
    getEditor3Field,
    getEditor3FormattingButton,
    getEditor3TextRun,
} from './utils/editor3';

/**
 * The formatting-style QA cases that `main`'s Story toolbar cannot serve. Every test
 * restores the `editor3-formats` snapshot, which is the only one that enables these
 * options on `body_html` and the only one carrying a custom editor3 text field
 * ("Sample rich text"), which each case's purpose names alongside the body.
 *
 * Preformatted text (1313669359) is partial on two product divergences from its steps,
 * both asserted here as the product actually behaves:
 * - Toggling the option off does not move the caret out of the preformatted block and
 *   start a new paragraph. It converts the block the caret is in back to unstyled, so
 *   the text typed into it stops being preformatted (SDESK-4253, linked from the case).
 * - The courier face the case asks for cannot be verified under the e2e harness. editor3
 *   declares the monospace family on the wrapper it puts around preformatted blocks, and
 *   `e2e/client/index.js` injects a `*:not([class^="icon-"], ...) {font-family: Arial}`
 *   override to keep the app font-stable for screenshots. That override outranks the
 *   editor3 rule on every descendant of the wrapper, so only the wrapper itself is
 *   asserted to carry the family. In the product both the block and its runs are
 *   monospace.
 */

// Every test restores a snapshot, boots the app and drives two full save/close/reopen
// round-trips, one for the body and one for the custom field, which does not fit the default
// per-test budget. The budget is well clear of the assertion timeouts inside those steps, so
// that a slow step fails on its own assertion rather than as a generic test timeout.
test.setTimeout(150000);

test.describe('editor3 formatting styles', () => {
    const SNAPSHOT = {snapshotName: 'editor3-formats'};

    // The Angular authoring view keys custom fields by display name, not vocabulary id.
    const CUSTOM_FIELD = 'Sample rich text';
    const CUSTOM_TEXT = 'golf';

    type ExpectRunStyled = (run: Locator, styled: boolean) => Promise<void>;
    type ExpectTextStyled = (field: Locator, text: string, styled: boolean) => Promise<void>;

    const expectStrikethrough: ExpectRunStyled = (run, struck) =>
        expect(run).toHaveCSS('text-decoration-line', struck ? 'line-through' : 'none');

    // Draft applies SUBSCRIPT and SUPERSCRIPT as `vertical-align` on the leaf; a run
    // carrying neither computes to `baseline`.
    const expectSubscript: ExpectRunStyled = (run, sub) =>
        expect(run).toHaveCSS('vertical-align', sub ? 'sub' : 'baseline');

    const expectSuperscript: ExpectRunStyled = (run, sup) =>
        expect(run).toHaveCSS('vertical-align', sup ? 'super' : 'baseline');

    // Draft renders `code-block` as a <pre> block and an unstyled paragraph as a <div>,
    // both carrying `data-block`. Preformatted is a block style, so it applies to the
    // whole paragraph even when only part of it is selected.
    const PRE_BLOCK = 'pre[data-block="true"]';
    const REGULAR_BLOCK = 'div[data-block="true"]';
    const PRE_WRAPPER = 'pre.public-DraftStyleDefault-pre';
    const MONO_FONT = /Roboto Mono/;

    const expectPreformatted: ExpectTextStyled = async (field, text, preformatted) => {
        const block = field.locator(preformatted ? PRE_BLOCK : REGULAR_BLOCK).filter({hasText: text});

        await expect(block).toHaveCount(1);
    };

    /** Lifts a run-level style assertion to the "this text in this field" shape. */
    function onTextRun(expectStyled: ExpectRunStyled): ExpectTextStyled {
        return (field, text, styled) => expectStyled(getEditor3TextRun(field, text), styled);
    }

    function getHeadlineField(page: Page): Locator {
        return page.getByTestId('field--headline').getByRole('textbox');
    }

    /**
     * Opens the Sports monitoring view on a restored database, and leaves it ready for an
     * article with `headline` to be created.
     *
     * A restore lands in the search index asynchronously, so a rerun of the same test can
     * still be served the article the previous run created, and would then edit that one
     * instead of a fresh article. Waiting for a fixture item to be listed and for the
     * headline to be absent gates on the restore being visible.
     */
    async function openMonitoring(page: Page, headline: string): Promise<void> {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await dismissSessionExpiry(page);
        await monitoring.selectDeskOrWorkspace('Sports');

        await expect(monitoring.getArticleLocator('test sports story').first()).toBeVisible();
        await expect(monitoring.getArticleLocator(headline)).toHaveCount(0);
    }

    async function createArticle(page: Page, headline: string): Promise<void> {
        const monitoring = new Monitoring(page);

        await openMonitoring(page, headline);
        await monitoring.createArticleFromDefaultTemplate();

        const headlineField = getHeadlineField(page);

        await expect(headlineField).toBeVisible();
        await headlineField.fill(headline);
        await expect(headlineField).toHaveText(headline);
    }

    /**
     * Repeats a style toggle on the custom editor3 field of the article that is open, and
     * re-asserts it after a save/close/reopen round-trip. Every case's purpose names custom
     * text fields next to the body, and this is the half the body flow does not drive.
     */
    async function toggleStyleOnCustomField(page: Page, options: {
        styleName: string;
        headline: string;
        expectStyled: ExpectTextStyled;
    }): Promise<void> {
        const {styleName, headline, expectStyled} = options;
        const authoring = new Authoring(page);
        const monitoring = new Monitoring(page);
        const field = getEditor3Field(page, CUSTOM_FIELD);
        const input = field.getByRole('textbox');
        const styleButton = getEditor3FormattingButton(field, styleName);

        await expect(input).toBeVisible();
        await input.click();

        await expect(styleButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await styleButton.click();
        await expect(styleButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);

        await page.keyboard.type(CUSTOM_TEXT);
        await expectStyled(field, CUSTOM_TEXT, true);

        await authoring.save();
        await authoring.close();

        await monitoring.getArticleLocator(headline).dblclick();
        await expect(input).toBeVisible();
        await expectStyled(field, CUSTOM_TEXT, true);
    }

    async function runInlineStyleCase(page: Page, options: {
        styleName: string;
        headline: string;
        expectStyled: ExpectRunStyled;
    }): Promise<void> {
        const {styleName, headline, expectStyled} = options;

        await restoreDatabaseSnapshot(SNAPSHOT);
        await openMonitoring(page, headline);
        await runEditor3InlineStyleToggleScenario(page, {
            styleName,
            headline,
            expectStyled,
            alreadyOnMonitoring: true,
        });
        await toggleStyleOnCustomField(page, {
            styleName,
            headline,
            expectStyled: onTextRun(expectStyled),
        });
    }

    test('strikethrough toggles on typed text and on a selection, in the body and a custom field', {
        annotation: [
            {type: 'confluence', description: '1313669365 complete'}, // Strikethrough
        ],
    }, async ({page}) => {
        await runInlineStyleCase(page, {
            styleName: 'strikethrough',
            headline: 'strikethrough formatting test',
            expectStyled: expectStrikethrough,
        });
    });

    test('subscript toggles on typed text and on a selection, in the body and a custom field', {
        annotation: [
            {type: 'confluence', description: '1313669368 complete'}, // Subscript
        ],
    }, async ({page}) => {
        await runInlineStyleCase(page, {
            styleName: 'subscript',
            headline: 'subscript formatting test',
            expectStyled: expectSubscript,
        });
    });

    test('superscript toggles on typed text and on a selection, in the body and a custom field', {
        annotation: [
            {type: 'confluence', description: '1313669370 complete'}, // Superscript
        ],
    }, async ({page}) => {
        await runInlineStyleCase(page, {
            styleName: 'superscript',
            headline: 'superscript formatting test',
            expectStyled: expectSuperscript,
        });
    });

    /**
     * Tag of the editor3 block the caret sits in, or `undefined` when it sits outside one.
     * Read in the page because a collapsed selection has no DOM node Playwright can locate.
     */
    function getCaretBlockTag(page: Page): Promise<string | undefined> {
        return page.evaluate(() => {
            const node = window.getSelection()?.anchorNode;
            const element = node instanceof Element ? node : node?.parentElement;

            return element?.closest('[data-block="true"]')?.tagName;
        });
    }

    test('preformatted text toggles per paragraph in the body and a custom field', {
        annotation: [
            // Partial: two steps are asserted as the product behaves rather than as the case
            // describes (caret handling on toggle off, and the courier face). See the describe.
            {type: 'confluence', description: '1313669359 partial'}, // Preformatted text
        ],
    }, async ({page}) => {
        const headline = 'preformatted text test';

        // Each stretch of text is typed as two halves, so "select part of the text" is a
        // fixed number of Shift+Arrow presses and each half is addressable on its own.
        const PRE_FIRST = 'alpha';
        const REGULAR_FIRST = 'bravo';
        const SELECTED_HEAD = 'charlie';
        const SELECTED_TAIL = 'delta';
        const PRE_HEAD = 'echo';
        const PRE_TAIL = 'foxtrot';

        await restoreDatabaseSnapshot(SNAPSHOT);
        await createArticle(page, headline);

        const authoring = new Authoring(page);
        const monitoring = new Monitoring(page);
        const body = getEditor3Field(page, 'body_html');
        const bodyInput = body.getByRole('textbox');
        const preButton = getEditor3FormattingButton(body, 'pre');

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();

        await expect(preButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await preButton.click();
        await expect(preButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);

        // The empty block under the caret is the one that turned preformatted.
        await expect(body.locator(PRE_BLOCK)).toHaveCount(1);
        await expect.poll(() => getCaretBlockTag(page)).toBe('PRE');

        await page.keyboard.type(PRE_FIRST);
        await expectPreformatted(body, PRE_FIRST, true);
        await expect(body.locator(PRE_WRAPPER)).toHaveCSS('font-family', MONO_FONT);

        await preButton.click();
        await expect(preButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);

        // SDESK-4253: the block the caret is in reverts to unstyled instead of the caret
        // moving out into a fresh paragraph, so the text typed so far stops being preformatted.
        await expect(body.locator(PRE_BLOCK)).toHaveCount(0);
        await expectPreformatted(body, PRE_FIRST, false);

        await page.keyboard.type(REGULAR_FIRST);
        await expectPreformatted(body, PRE_FIRST + REGULAR_FIRST, false);

        await page.keyboard.press('Enter');
        await page.keyboard.type(SELECTED_HEAD + SELECTED_TAIL);
        await expectPreformatted(body, SELECTED_HEAD + SELECTED_TAIL, false);

        // The caret sits at the end of the regular paragraph; select its second half.
        await pressRepeatedly(page, 'Shift+ArrowLeft', SELECTED_TAIL.length);

        await expect(preButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await preButton.click();
        await expect(preButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectPreformatted(body, SELECTED_HEAD + SELECTED_TAIL, true);

        // Collapse the selection to its end, which is the end of the paragraph, and start a
        // fresh one; it inherits the preformatted block style.
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await expect(preButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);

        await page.keyboard.type(PRE_HEAD + PRE_TAIL);
        await expectPreformatted(body, PRE_HEAD + PRE_TAIL, true);

        await pressRepeatedly(page, 'Shift+ArrowLeft', PRE_TAIL.length);

        await preButton.click();
        await expect(preButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectPreformatted(body, PRE_HEAD + PRE_TAIL, false);

        await authoring.save();
        await authoring.close();

        await monitoring.getArticleLocator(headline).dblclick();
        await expect(bodyInput).toBeVisible();

        await expect(getHeadlineField(page)).toHaveText(headline);
        await expectPreformatted(body, PRE_FIRST + REGULAR_FIRST, false);
        await expectPreformatted(body, SELECTED_HEAD + SELECTED_TAIL, true);
        await expectPreformatted(body, PRE_HEAD + PRE_TAIL, false);

        await toggleStyleOnCustomField(page, {
            styleName: 'pre',
            headline,
            expectStyled: expectPreformatted,
        });
    });

    /**
     * The formatting-marks button is the one toolbar option with no `data-test-value`: the
     * toolbar passes StyleButton the internal label `invisibles`, which has no entry in the
     * formatting-option map, so the button has to be found by its tooltip.
     */
    function getFormattingMarksButton(field: Locator): Locator {
        return field.getByTestId('toolbar')
            .getByTestId('formatting-option-button')
            .and(field.page().locator('[data-sd-tooltip="Toggle formatting marks"]'));
    }

    // The mark is an `::after` pseudo-element on every block, carrying an icon-font glyph
    // in `--sd-colour-interactive`, the blue the case names. Pseudo-elements are not
    // locatable, so their computed style is read in the page.
    const MARKER_GLYPH = '"\uE690"';
    const MARKER_COLOUR = 'rgb(64, 153, 191)';

    function getBlockMarkers(field: Locator): Promise<Array<string>> {
        return field.locator('[data-block="true"]').evaluateAll(
            (blocks) => blocks.map((block) => window.getComputedStyle(block, '::after').content),
        );
    }

    function getBlockMarkerColour(field: Locator): Promise<string> {
        return field.locator('[data-block="true"]').first().evaluate(
            (block) => window.getComputedStyle(block, '::after').color,
        );
    }

    async function expectFormattingMarks(field: Locator, blocks: number, shown: boolean): Promise<void> {
        await expect.poll(() => getBlockMarkers(field))
            .toEqual(Array.from({length: blocks}, () => shown ? MARKER_GLYPH : 'none'));
    }

    test('formatting marks toggle paragraph marks per editor, in the body and a custom field', {
        annotation: [
            {type: 'confluence', description: '1313669377 complete'}, // Toggle formatting marks
        ],
    }, async ({page}) => {
        const headline = 'formatting marks test';
        const PARAGRAPHS = ['alpha', 'bravo', 'charlie'];

        await restoreDatabaseSnapshot(SNAPSHOT);
        await createArticle(page, headline);

        const authoring = new Authoring(page);
        const monitoring = new Monitoring(page);
        const body = getEditor3Field(page, 'body_html');
        const bodyInput = body.getByRole('textbox');
        const marksButton = getFormattingMarksButton(body);

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();

        await expect(marksButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectFormattingMarks(body, 1, false);

        await marksButton.click();
        await expect(marksButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectFormattingMarks(body, 1, true);
        await expect.poll(() => getBlockMarkerColour(body)).toBe(MARKER_COLOUR);

        for (const [index, paragraph] of PARAGRAPHS.entries()) {
            if (index > 0) {
                await page.keyboard.press('Enter');
            }

            await page.keyboard.type(paragraph);
        }

        await expectFormattingMarks(body, PARAGRAPHS.length, true);

        await marksButton.click();
        await expect(marksButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectFormattingMarks(body, PARAGRAPHS.length, false);

        await marksButton.click();
        await expect(marksButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectFormattingMarks(body, PARAGRAPHS.length, true);

        const custom = getEditor3Field(page, CUSTOM_FIELD);
        const customInput = custom.getByRole('textbox');
        const customMarksButton = getFormattingMarksButton(custom);

        await expect(customInput).toBeVisible();
        await customInput.click();
        await page.keyboard.type(CUSTOM_TEXT);

        await expect(customMarksButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectFormattingMarks(custom, 1, false);

        await customMarksButton.click();
        await expect(customMarksButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectFormattingMarks(custom, 1, true);

        // The toggle is per editor instance, so turning it on in the custom field leaves
        // the body's own marks as they were.
        await expectFormattingMarks(body, PARAGRAPHS.length, true);

        await authoring.save();
        await authoring.close();

        await monitoring.getArticleLocator(headline).dblclick();
        await expect(bodyInput).toBeVisible();

        await expect(getHeadlineField(page)).toHaveText(headline);

        // Consecutive unstyled blocks share one wrapper element, so the paragraphs are read
        // off the blocks themselves rather than off the editor's top-level children.
        await expect(body.locator('[data-block="true"]')).toHaveText(PARAGRAPHS);
        await expect(custom.locator('[data-block="true"]')).toHaveText([CUSTOM_TEXT]);

        // The toggle is editor UI state rather than part of the item, so a reopened article
        // comes back with the marks off.
        await expect(marksButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectFormattingMarks(body, PARAGRAPHS.length, false);
    });
});
