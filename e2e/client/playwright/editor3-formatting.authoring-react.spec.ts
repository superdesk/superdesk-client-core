import {test, expect, type Locator, type Page} from '@playwright/test';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {
    EDITOR3_ACTIVE_BUTTON,
    getEditor3Field,
    getEditor3FormattingButton,
    getEditor3SelectionButton,
    getEditor3TextRun,
    pressRepeatedly,
} from './utils/editor3';
import {createArticle, saveCloseAndReopen} from './scenarios/authoring-react-article';

/**
 * The editor3 formatting QA cases on authoring-react, each driven in the body and in a custom
 * editor3 text field. `editor3-formats` is the only snapshot that offers every option on
 * `body_html` and the only one with a custom editor3 field ("Sample rich text"), which
 * authoring-react keys by its vocabulary id.
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});

// Every test creates an article, drives two fields and does a save/close/reopen round-trip.
test.setTimeout(150000);

const SNAPSHOT = {snapshotName: 'editor3-formats'};
const CUSTOM_FIELD = 'sample_rich_text';

type ExpectRunStyled = (run: Locator, styled: boolean) => Promise<void>;

async function focusField(field: Locator): Promise<void> {
    const input = field.getByRole('textbox').first();

    await expect(input).toBeVisible();
    await input.click();
}

// Each stretch is typed as two halves, so "select part of the text" is a fixed number of
// Shift+Arrow presses and each half is addressable on its own.
const STYLED_HEAD = 'alpha';
const STYLED_TAIL = 'bravo';
const REGULAR_HEAD = 'charlie';
const REGULAR_TAIL = 'delta';
const CUSTOM_TEXT = 'golf';

/**
 * Toggle the style on and type, toggle it off and type, then toggle it over a selection of
 * regular text and back off over a selection of styled text. Leaves the four runs as
 * styled / regular / regular / styled.
 */
async function runInlineStyleCycle(field: Locator, styleName: string, expectStyled: ExpectRunStyled): Promise<void> {
    const page = field.page();
    const button = getEditor3FormattingButton(field, styleName);
    const run = (text: string) => getEditor3TextRun(field, text);

    await focusField(field);

    await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await button.click();
    await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);

    await page.keyboard.type(STYLED_HEAD + STYLED_TAIL);
    await expectStyled(run(STYLED_HEAD + STYLED_TAIL), true);

    await button.click();
    await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);

    await page.keyboard.type(REGULAR_HEAD + REGULAR_TAIL);
    await expectStyled(run(REGULAR_HEAD + REGULAR_TAIL), false);

    await pressRepeatedly(page, 'Shift+ArrowLeft', REGULAR_TAIL.length);
    await button.click();
    await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await expectStyled(run(REGULAR_TAIL), true);
    await expectStyled(run(REGULAR_HEAD), false);

    // Counted arrow presses rather than Home/End, which do not move the caret on macOS.
    await page.keyboard.press('ArrowLeft');
    await pressRepeatedly(page, 'ArrowLeft', REGULAR_HEAD.length);
    await pressRepeatedly(page, 'Shift+ArrowLeft', STYLED_TAIL.length);

    await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await button.click();
    await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await expectStyled(run(STYLED_TAIL), false);
    await expectStyled(run(STYLED_HEAD), true);
}

async function expectInlineStyleCycleResult(field: Locator, expectStyled: ExpectRunStyled): Promise<void> {
    const run = (text: string) => getEditor3TextRun(field, text);

    await expectStyled(run(STYLED_HEAD), true);
    await expectStyled(run(STYLED_TAIL), false);
    await expectStyled(run(REGULAR_HEAD), false);
    await expectStyled(run(REGULAR_TAIL), true);
}

async function typeStyledInCustomField(page: Page, styleName: string, expectStyled: ExpectRunStyled): Promise<void> {
    const custom = getEditor3Field(page, CUSTOM_FIELD);
    const button = getEditor3FormattingButton(custom, styleName);

    await focusField(custom);
    await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await button.click();
    await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await page.keyboard.type(CUSTOM_TEXT);
    await expectStyled(getEditor3TextRun(custom, CUSTOM_TEXT), true);
}

async function runInlineStyleCase(page: Page, styleName: string, expectStyled: ExpectRunStyled): Promise<void> {
    const headline = `${styleName} formatting test`;

    await restoreDatabaseSnapshot(SNAPSHOT);
    await createArticle(page, headline);

    const body = getEditor3Field(page, 'body_html');
    const custom = getEditor3Field(page, CUSTOM_FIELD);

    await runInlineStyleCycle(body, styleName, expectStyled);
    await typeStyledInCustomField(page, styleName, expectStyled);

    await saveCloseAndReopen(page, headline);

    await expectInlineStyleCycleResult(body, expectStyled);
    await expectStyled(getEditor3TextRun(custom, CUSTOM_TEXT), true);
}

// Asserted as "not 700" rather than a literal: the regular weight is a theme value.
const expectBold: ExpectRunStyled = (run, bold) => bold
    ? expect(run).toHaveCSS('font-weight', '700')
    : expect(run).not.toHaveCSS('font-weight', '700');

const expectItalic: ExpectRunStyled = (run, italic) =>
    expect(run).toHaveCSS('font-style', italic ? 'italic' : 'normal');

const expectUnderline: ExpectRunStyled = (run, underlined) =>
    expect(run).toHaveCSS('text-decoration-line', underlined ? 'underline' : 'none');

const expectStrikethrough: ExpectRunStyled = (run, struck) =>
    expect(run).toHaveCSS('text-decoration-line', struck ? 'line-through' : 'none');

const expectSubscript: ExpectRunStyled = (run, sub) =>
    expect(run).toHaveCSS('vertical-align', sub ? 'sub' : 'baseline');

const expectSuperscript: ExpectRunStyled = (run, sup) =>
    expect(run).toHaveCSS('vertical-align', sup ? 'super' : 'baseline');

test.describe('editor3 inline styles (authoring-react)', () => {
    test('bold toggles on typed text and a selection in the body and a custom field, and survives reopen', {
        annotation: [{type: 'confluence', description: '1313669361 complete'}], // Bold
    }, async ({page}) => {
        await runInlineStyleCase(page, 'bold', expectBold);
    });

    test('italic toggles on typed text and a selection in the body and a custom field, and survives reopen', {
        annotation: [{type: 'confluence', description: '1313669363 complete'}], // Italic
    }, async ({page}) => {
        await runInlineStyleCase(page, 'italic', expectItalic);
    });

    test('underline toggles on typed text and a selection in the body and a custom field, and survives reopen', {
        annotation: [{type: 'confluence', description: '1313669372 complete'}], // Underline
    }, async ({page}) => {
        await runInlineStyleCase(page, 'underline', expectUnderline);
    });

    test('strikethrough toggles on typed text and a selection in the body and a custom field, and survives reopen', {
        annotation: [{type: 'confluence', description: '1313669365 complete'}], // Strikethrough
    }, async ({page}) => {
        await runInlineStyleCase(page, 'strikethrough', expectStrikethrough);
    });

    test('subscript toggles on typed text and a selection in the body and a custom field, and survives reopen', {
        annotation: [{type: 'confluence', description: '1313669368 complete'}], // Subscript
    }, async ({page}) => {
        await runInlineStyleCase(page, 'subscript', expectSubscript);
    });

    test('superscript toggles on typed text and a selection in the body and a custom field, and survives reopen', {
        annotation: [{type: 'confluence', description: '1313669370 complete'}], // Superscript
    }, async ({page}) => {
        await runInlineStyleCase(page, 'superscript', expectSuperscript);
    });
});

/**
 * Block styles. Draft renders each block as the element its type maps to, tagged with
 * `data-block`: headings as `h1`..`h6`, a quote as `blockquote`, preformatted as `pre`, list
 * items as `li` inside `ul`/`ol`, and an unstyled block as `div`.
 */
interface IBlockStyle {
    /** The formatting option on the toolbar button. */
    option: string;

    /** CSS selector of a block in this style. */
    styled: string;
}

const REGULAR_BLOCK = 'div[data-block="true"]';

function blockWithText(field: Locator, selector: string, text: string): Locator {
    return field.locator(selector).filter({hasText: text});
}

async function expectBlock(field: Locator, selector: string, text: string): Promise<void> {
    await expect(blockWithText(field, selector, text)).toHaveCount(1);
}

function blockTexts(suffix: string) {
    return {
        typedStyled: `alpha${suffix}`,
        typedRegular: `bravo${suffix}`,
        regularHead: `charlie${suffix}`,
        regularTail: `delta${suffix}`,
        styledHead: `echo${suffix}`,
        styledTail: `foxtrot${suffix}`,
    };
}

/**
 * Toggles the block style on and types, toggles it off (which converts the block the caret is
 * in, text included), then applies it to a regular paragraph through a partial selection,
 * starts a new block that inherits it, and removes it again through a partial selection. Ends
 * with the caret on a fresh empty regular block, so cycles can be chained.
 */
async function runBlockStyleCycle(field: Locator, style: IBlockStyle, suffix: string): Promise<void> {
    const page = field.page();
    const button = getEditor3FormattingButton(field, style.option);
    const texts = blockTexts(suffix);

    await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await button.click();
    await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);

    await page.keyboard.type(texts.typedStyled);
    await expectBlock(field, style.styled, texts.typedStyled);

    await button.click();
    await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);

    await page.keyboard.type(texts.typedRegular);
    await expectBlock(field, REGULAR_BLOCK, texts.typedStyled + texts.typedRegular);

    await page.keyboard.press('Enter');
    await page.keyboard.type(texts.regularHead + texts.regularTail);
    await expectBlock(field, REGULAR_BLOCK, texts.regularHead + texts.regularTail);

    await pressRepeatedly(page, 'Shift+ArrowLeft', texts.regularTail.length);
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe(texts.regularTail);

    await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await button.click();
    await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await expectBlock(field, style.styled, texts.regularHead + texts.regularTail);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);

    await page.keyboard.type(texts.styledHead + texts.styledTail);
    await expectBlock(field, style.styled, texts.styledHead + texts.styledTail);

    await pressRepeatedly(page, 'Shift+ArrowLeft', texts.styledTail.length);
    await button.click();
    await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
    await expectBlock(field, REGULAR_BLOCK, texts.styledHead + texts.styledTail);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
}

async function expectBlockStyleCycleResult(field: Locator, style: IBlockStyle, suffix: string): Promise<void> {
    const texts = blockTexts(suffix);

    await expectBlock(field, REGULAR_BLOCK, texts.typedStyled + texts.typedRegular);
    await expectBlock(field, style.styled, texts.regularHead + texts.regularTail);
    await expectBlock(field, REGULAR_BLOCK, texts.styledHead + texts.styledTail);
}

async function runBlockStyleCase(page: Page, styles: Array<IBlockStyle>, headline: string): Promise<void> {
    await restoreDatabaseSnapshot(SNAPSHOT);
    await createArticle(page, headline);

    const body = getEditor3Field(page, 'body_html');
    const custom = getEditor3Field(page, CUSTOM_FIELD);

    for (const field of [body, custom]) {
        await focusField(field);

        for (const style of styles) {
            await runBlockStyleCycle(field, style, style.option.replace(' ', ''));
        }
    }

    await saveCloseAndReopen(page, headline);

    for (const field of [body, custom]) {
        for (const style of styles) {
            await expectBlockStyleCycleResult(field, style, style.option.replace(' ', ''));
        }
    }
}

test.describe('editor3 block styles (authoring-react)', () => {
    test('each heading level toggles on typed text and a selection in both fields, and survives reopen', {
        annotation: [{type: 'confluence', description: '1313669351 complete'}], // Headings H1-H6
    }, async ({page}) => {
        const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => ({
            option: tag,
            styled: `${tag}[data-block="true"]`,
        }));

        await runBlockStyleCase(page, headings, 'heading formatting test');
    });

    test('quote toggles on typed text and a selection in the body and a custom field, and survives reopen', {
        annotation: [{type: 'confluence', description: '1313669353 complete'}], // Quote
    }, async ({page}) => {
        await runBlockStyleCase(
            page,
            [{option: 'quote', styled: 'blockquote[data-block="true"]'}],
            'quote formatting test',
        );
    });

    test('unordered list toggles on typed text and a selection in the body and a custom field, and survives reopen', {
        annotation: [{type: 'confluence', description: '1313669355 complete'}], // Unordered list
    }, async ({page}) => {
        await runBlockStyleCase(
            page,
            [{option: 'unordered list', styled: 'ul > li[data-block="true"]'}],
            'unordered list formatting test',
        );
    });

    test('ordered list toggles on typed text and a selection in the body and a custom field, and survives reopen', {
        annotation: [{type: 'confluence', description: '1313669357 complete'}], // Ordered list
    }, async ({page}) => {
        await runBlockStyleCase(
            page,
            [{option: 'ordered list', styled: 'ol > li[data-block="true"]'}],
            'ordered list formatting test',
        );
    });

    test('preformatted text toggles per paragraph in the body and a custom field, and survives reopen', {
        annotation: [
            // Partial for the same reasons as the angular spec (editor3.formatting-styles.spec.ts):
            // toggling off converts the current block instead of starting a new paragraph
            // (SDESK-4253), and the courier face is masked by the e2e font override.
            {type: 'confluence', description: '1313669359 partial'}, // Preformatted text
        ],
    }, async ({page}) => {
        await runBlockStyleCase(
            page,
            [{option: 'pre', styled: 'pre[data-block="true"]'}],
            'preformatted formatting test',
        );
    });
});

/**
 * The list cases' further scenarios: splitting a list by toggling a middle item off, and backspace
 * on an empty item plus converting a selection of paragraphs. Draft groups consecutive same-type
 * blocks under one wrapper (`ol`/`ul` for list items, a div for paragraphs), so reading the
 * wrappers in order with their blocks' text says where each list starts and ends.
 */
interface IBlockGroup {
    list: boolean;
    blocks: Array<string>;
}

function readBodyGroups(body: Locator, listTag: 'OL' | 'UL'): Promise<Array<IBlockGroup>> {
    return body.locator('[data-contents="true"]').first().evaluate((contents, tag) =>
        Array.from(contents.children).map((group) => ({
            list: group.tagName === tag,
            blocks: (
                group.getAttribute('data-block') === 'true'
                    ? [group]
                    : Array.from(group.querySelectorAll('[data-block="true"]'))
            ).map((block) => block.textContent ?? ''),
        })), listTag);
}

for (const list of [
    {option: 'ordered list', tag: 'OL' as const, case: '1313669357', name: 'Ordered list'},
    {option: 'unordered list', tag: 'UL' as const, case: '1313669355', name: 'Unordered list'},
]) {
    test.describe(`editor3 ${list.option} scenarios (authoring-react)`, () => {
        const [ONE, TWO, THREE] = ['alpha', 'bravo', 'charlie'];
        const [P_ONE, P_TWO, P_THREE] = ['delta', 'echo', 'foxtrot'];
        const annotation = [{type: 'confluence', description: `${list.case} complete`}];

        async function expectBody(body: Locator, expected: Array<IBlockGroup>): Promise<void> {
            await expect.poll(() => readBodyGroups(body, list.tag)).toEqual(expected);
        }

        async function startList(page: Page, headline: string): Promise<{body: Locator; button: Locator}> {
            await restoreDatabaseSnapshot(SNAPSHOT);
            await createArticle(page, headline);

            const body = getEditor3Field(page, 'body_html');
            const button = getEditor3FormattingButton(body, list.option);

            await focusField(body);
            await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
            await button.click();
            await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);
            await expectBody(body, [{list: true, blocks: ['']}]);

            return {body, button};
        }

        test(`toggling the ${list.option} off on a middle item splits the list, and the split survives reopen`, {
            annotation,
        }, async ({page}) => {
            const headline = `${list.option} split test`;
            const {body, button} = await startList(page, headline);

            await page.keyboard.type(ONE);
            await page.keyboard.press('Enter');
            await page.keyboard.type(TWO);
            await page.keyboard.press('Enter');
            await page.keyboard.type(THREE);
            await expectBody(body, [{list: true, blocks: [ONE, TWO, THREE]}]);

            // walk the caret back over the third item and across the block boundary into the second
            await pressRepeatedly(page, 'ArrowLeft', THREE.length + 1);
            await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);
            await button.click();
            await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);

            const split: Array<IBlockGroup> = [
                {list: true, blocks: [ONE]},
                {list: false, blocks: [TWO]},
                {list: true, blocks: [THREE]},
            ];

            await expectBody(body, split);
            await saveCloseAndReopen(page, headline);
            await expectBody(body, split);
        });

        test(`backspace on an empty ${list.option} item ends the list, and a paragraph selection converts to a list`, {
            annotation,
        }, async ({page}) => {
            const headline = `${list.option} backspace test`;
            const {body, button} = await startList(page, headline);

            await page.keyboard.type(ONE);
            await page.keyboard.press('Enter');
            await page.keyboard.type(TWO);
            await page.keyboard.press('Enter');
            await expectBody(body, [{list: true, blocks: [ONE, TWO, '']}]);

            await page.keyboard.press('Backspace');
            await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
            await expectBody(body, [
                {list: true, blocks: [ONE, TWO]},
                {list: false, blocks: ['']},
            ]);

            await page.keyboard.type(P_ONE);
            await page.keyboard.press('Enter');
            await page.keyboard.type(P_TWO);
            await page.keyboard.press('Enter');
            await page.keyboard.type(P_THREE);
            await expectBody(body, [
                {list: true, blocks: [ONE, TWO]},
                {list: false, blocks: [P_ONE, P_TWO, P_THREE]},
            ]);

            await pressRepeatedly(page, 'Shift+ArrowLeft', P_THREE.length + 1 + P_TWO.length);
            await button.click();
            await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);

            const converted: Array<IBlockGroup> = [
                {list: true, blocks: [ONE, TWO]},
                {list: false, blocks: [P_ONE]},
                {list: true, blocks: [P_TWO, P_THREE]},
            ];

            await expectBody(body, converted);
            await saveCloseAndReopen(page, headline);
            await expectBody(body, converted);
        });
    });
}

test.describe('editor3 formatting marks (authoring-react)', () => {
    /**
     * The formatting-marks button carries no `data-test-value`: the toolbar passes StyleButton
     * the internal label `invisibles`, which has no formatting-option id, so it is found by tooltip.
     */
    function getFormattingMarksButton(field: Locator): Locator {
        return field.getByTestId('toolbar')
            .getByTestId('formatting-option-button')
            .and(field.page().locator('[data-sd-tooltip="Toggle formatting marks"]'));
    }

    // The mark is an icon-font glyph in a `::after` on every block; pseudo-elements are read in the page.
    const MARKER_GLYPH = '""';

    function getBlockMarkers(field: Locator): Promise<Array<string>> {
        return field.locator('[data-block="true"]').evaluateAll(
            (blocks) => blocks.map((block) => window.getComputedStyle(block, '::after').content),
        );
    }

    async function expectMarks(field: Locator, blocks: number, shown: boolean): Promise<void> {
        await expect.poll(() => getBlockMarkers(field))
            .toEqual(Array.from({length: blocks}, () => shown ? MARKER_GLYPH : 'none'));
    }

    test('formatting marks toggle paragraph marks per editor in the body and a custom field', {
        annotation: [{type: 'confluence', description: '1313669377 complete'}], // Toggle formatting marks
    }, async ({page}) => {
        const headline = 'formatting marks test';
        const PARAGRAPHS = ['alpha', 'bravo', 'charlie'];

        await restoreDatabaseSnapshot(SNAPSHOT);
        await createArticle(page, headline);

        const body = getEditor3Field(page, 'body_html');
        const custom = getEditor3Field(page, CUSTOM_FIELD);
        const marks = getFormattingMarksButton(body);
        const customMarks = getFormattingMarksButton(custom);

        await focusField(body);
        await expect(marks).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectMarks(body, 1, false);

        await marks.click();
        await expect(marks).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectMarks(body, 1, true);

        for (const [index, paragraph] of PARAGRAPHS.entries()) {
            if (index > 0) {
                await page.keyboard.press('Enter');
            }

            await page.keyboard.type(paragraph);
        }

        await expectMarks(body, PARAGRAPHS.length, true);

        await marks.click();
        await expect(marks).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectMarks(body, PARAGRAPHS.length, false);

        await marks.click();
        await expectMarks(body, PARAGRAPHS.length, true);

        await focusField(custom);
        await page.keyboard.type(CUSTOM_TEXT);
        await expectMarks(custom, 1, false);

        await customMarks.click();
        await expect(customMarks).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectMarks(custom, 1, true);
        await expectMarks(body, PARAGRAPHS.length, true);

        await saveCloseAndReopen(page, headline);

        await expect(body.locator('[data-block="true"]')).toHaveText(PARAGRAPHS);
        await expect(custom.locator('[data-block="true"]')).toHaveText([CUSTOM_TEXT]);

        // The toggle is editor UI state, not part of the item, so a reopened article starts with it off.
        await expect(marks).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectMarks(body, PARAGRAPHS.length, false);
    });
});

/**
 * No snapshot enables `remove format`, `undo` or `redo` on any field, so these cases switch them
 * on for the Story body through the content profile settings first. The list replaces the
 * body's options rather than adding to them, so it repeats the ones the tests also use.
 */
async function enableBodyOptions(page: Page, options: Array<string>): Promise<void> {
    await page.goto('/#/settings/content-profiles');
    await new ContentProfileSettings(page).addFormattingOptionToContentProfile({
        profileName: 'Story',
        sectionName: 'Content fields',
        fieldName: 'Body HTML',
        formattingOptionsToAdd: options,
    });
}

test.describe('editor3 remove format (authoring-react)', () => {
    test('remove formatting clears the inline styles of the selection only, and the result survives reopen', {
        annotation: [{type: 'confluence', description: '1313669375 complete'}], // Remove format
    }, async ({page}) => {
        const headline = 'remove format test';
        const CLEARED = 'alpha';
        const KEPT = 'bravo';

        await restoreDatabaseSnapshot();
        await enableBodyOptions(page, ['bold', 'italic', 'remove format']);
        await createArticle(page, headline);

        const body = getEditor3Field(page, 'body_html');
        const removeFormat = getEditor3SelectionButton(body, 'Remove formatting');

        await focusField(body);
        await getEditor3FormattingButton(body, 'bold').click();
        await getEditor3FormattingButton(body, 'italic').click();
        await page.keyboard.type(CLEARED + KEPT);

        await expectBold(getEditor3TextRun(body, CLEARED + KEPT), true);
        await expectItalic(getEditor3TextRun(body, CLEARED + KEPT), true);

        // the button only works on a selection
        await expect(removeFormat).toHaveClass(/inactive/);

        await pressRepeatedly(page, 'ArrowLeft', KEPT.length);
        await pressRepeatedly(page, 'Shift+ArrowLeft', CLEARED.length);
        await expect(removeFormat).not.toHaveClass(/inactive/);
        await removeFormat.click();

        await expectBold(getEditor3TextRun(body, CLEARED), false);
        await expectItalic(getEditor3TextRun(body, CLEARED), false);
        await expectBold(getEditor3TextRun(body, KEPT), true);
        await expectItalic(getEditor3TextRun(body, KEPT), true);

        await saveCloseAndReopen(page, headline);

        await expectBold(getEditor3TextRun(body, CLEARED), false);
        await expectItalic(getEditor3TextRun(body, CLEARED), false);
        await expectBold(getEditor3TextRun(body, KEPT), true);
        await expectItalic(getEditor3TextRun(body, KEPT), true);
    });
});

test.describe('editor3 undo and redo (authoring-react)', () => {
    test('the toolbar and keyboard undo remove the last edit and redo restores it, and the result is what gets saved', {
        annotation: [{type: 'confluence', description: '10307010593 complete'}], // Undo / Redo
    }, async ({page}) => {
        const headline = 'undo redo test';
        const KEPT = 'alpha';
        const UNDONE = 'bravo';

        await restoreDatabaseSnapshot();
        await enableBodyOptions(page, ['bold', 'italic', 'undo', 'redo']);
        await createArticle(page, headline);

        const body = getEditor3Field(page, 'body_html');
        const blocks = body.locator('[data-block="true"]');
        const toolbar = body.getByTestId('toolbar');
        const undo = toolbar.getByRole('button', {name: 'Undo (ctrl + z)', exact: true});
        const redo = toolbar.getByRole('button', {name: 'Redo (ctrl + y)', exact: true});

        await focusField(body);
        await page.keyboard.type(KEPT);
        await page.keyboard.press('Enter');
        await getEditor3FormattingButton(body, 'bold').click();
        await page.keyboard.type(UNDONE);

        await expect(blocks).toHaveText([KEPT, UNDONE]);
        await expectBold(getEditor3TextRun(body, UNDONE), true);

        // Draft.js groups consecutive typing into one undo step; the block split before it is another.
        await undo.click();
        await expect(blocks).toHaveText([KEPT, '']);

        await redo.click();
        await expect(blocks).toHaveText([KEPT, UNDONE]);
        await expectBold(getEditor3TextRun(body, UNDONE), true);

        // The tooltips advertise ctrl+z and ctrl+y, on every platform.
        await page.keyboard.press('Control+z');
        await expect(blocks).toHaveText([KEPT, '']);

        await page.keyboard.press('Control+y');
        await expect(blocks).toHaveText([KEPT, UNDONE]);

        await undo.click();
        await expect(blocks).toHaveText([KEPT, '']);

        await saveCloseAndReopen(page, headline);

        await expect(blocks).toHaveText([KEPT, '']);
    });
});
