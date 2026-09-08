import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {ACTIVE_FORMATTING_BUTTON, Authoring} from './page-object-models/authoring';
import {pressRepeatedly, restoreDatabaseSnapshot} from './utils';

test.describe('ordered list in the article body', () => {
    const ITEM_ONE = 'alpha';
    const ITEM_TWO = 'bravo';
    const ITEM_THREE = 'charlie';

    const PARAGRAPH_ONE = 'delta';
    const PARAGRAPH_TWO = 'echo';
    const PARAGRAPH_THREE = 'foxtrot';

    interface IBlockGroup {
        list: boolean;
        blocks: Array<string>;
    }

    function getBody(page: Page): Locator {
        return new Authoring(page).fieldContainer('body_html');
    }

    function getListButton(page: Page): Locator {
        return new Authoring(page).formattingOptionButton('body_html', 'ordered list');
    }

    /**
     * Draft.js groups every run of consecutive same-type blocks under one wrapper: an `<ol>` for
     * list items, a `<div class="unstyled">` for paragraphs. Reading those wrappers in document
     * order, each with the text of its blocks, is what says where a list starts and ends and which
     * item is which.
     *
     * The paragraph wrapper is conditional: editor3 only renders it when the field offers one of
     * the formatting options that need a drop area ('media', 'multi-line quote', 'embed articles',
     * 'custom blocks'), which the Story/body_html profile does through 'media'. Without one of
     * those, Draft renders each unstyled block as a direct child of the contents element, so a
     * child that is itself a block is read as a group holding only itself and the expectations
     * below fail on a readable diff rather than on empty groups.
     *
     * The visible "1." / "2." ordinals come from Draft's CSS counters on `::before`, and Chromium
     * reports `content` with the `counter()` unresolved, so they cannot be read back. An item's
     * position inside its own `<ol>` is the same fact expressed in the DOM.
     */
    function readBody(page: Page): Promise<Array<IBlockGroup>> {
        return getBody(page).locator('[data-contents="true"]').first().evaluate((contents) =>
            Array.from(contents.children).map((group) => ({
                list: group.tagName === 'OL',
                blocks: (
                    group.getAttribute('data-block') === 'true'
                        ? [group]
                        : Array.from(group.querySelectorAll('[data-block="true"]'))
                ).map((block) => block.textContent ?? ''),
            })),
        );
    }

    async function expectBody(page: Page, expected: Array<IBlockGroup>): Promise<void> {
        await expect.poll(() => readBody(page)).toEqual(expected);
    }

    async function createArticle(page: Page, headline: string): Promise<void> {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.createArticleFromDefaultTemplate();

        const headlineField = page.getByTestId('field--headline').getByRole('textbox');

        await expect(headlineField).toBeVisible();
        await headlineField.fill(headline);
        await expect(headlineField).toHaveText(headline);

        const bodyInput = getBody(page).getByRole('textbox');

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();
    }

    /**
     * Turns the list on from the toolbar and types three items, asserting after every step that
     * the item landed in the list. This is steps 2-7 of the case, which the case itself asks to
     * repeat before the split and the backspace scenarios.
     */
    async function typeThreeItemList(page: Page): Promise<void> {
        const listButton = getListButton(page);

        await expect(listButton).not.toHaveClass(ACTIVE_FORMATTING_BUTTON);
        await listButton.click();
        await expect(listButton).toHaveClass(ACTIVE_FORMATTING_BUTTON);
        await expectBody(page, [{list: true, blocks: ['']}]);

        await page.keyboard.type(ITEM_ONE);
        await expectBody(page, [{list: true, blocks: [ITEM_ONE]}]);

        await page.keyboard.press('Enter');
        await expectBody(page, [{list: true, blocks: [ITEM_ONE, '']}]);
        await page.keyboard.type(ITEM_TWO);
        await expectBody(page, [{list: true, blocks: [ITEM_ONE, ITEM_TWO]}]);

        await page.keyboard.press('Enter');
        await expectBody(page, [{list: true, blocks: [ITEM_ONE, ITEM_TWO, '']}]);
        await page.keyboard.type(ITEM_THREE);
        await expectBody(page, [{list: true, blocks: [ITEM_ONE, ITEM_TWO, ITEM_THREE]}]);

        await expect(listButton).toHaveClass(ACTIVE_FORMATTING_BUTTON);
    }

    async function saveCloseAndReopen(page: Page, headline: string): Promise<void> {
        await new Authoring(page).closeSavingChanges();

        await new Monitoring(page).getArticleLocator(headline).dblclick();
        await expect(getBody(page).getByRole('textbox')).toBeVisible();
        await expect(page.getByTestId('field--headline').getByRole('textbox')).toHaveText(headline);
    }

    // Partial: only body_html is covered here. The case's description also names custom text
    // fields; the `editor3-formats` snapshot provides one ("Sample rich text"), and that half
    // belongs to the consolidated formatting-styles spec (#5327), not this file.
    const ANNOTATION = [
        {type: 'confluence', description: '1313669357 partial'}, // Ordered list
    ];

    // 'ordered list' is not among the formatting options `main` gives Story/body_html, so these
    // tests run on the `ordered-list` record, which is `main` plus that one option.
    const SNAPSHOT = {snapshotName: 'ordered-list'};

    test('toolbar toggle starts a list, Enter adds items, toggling off drops the last one', {
        annotation: ANNOTATION,
    }, async ({page}) => {
        await restoreDatabaseSnapshot(SNAPSHOT);

        const headline = 'ordered list typing test';

        await createArticle(page, headline);
        await typeThreeItemList(page);

        const listButton = getListButton(page);

        await listButton.click();
        await expect(listButton).not.toHaveClass(ACTIVE_FORMATTING_BUTTON);

        const split: Array<IBlockGroup> = [
            {list: true, blocks: [ITEM_ONE, ITEM_TWO]},
            {list: false, blocks: [ITEM_THREE]},
        ];

        await expectBody(page, split);

        await saveCloseAndReopen(page, headline);
        await expectBody(page, split);
    });

    test('toggling the list off on a middle item splits it into two lists', {
        annotation: ANNOTATION,
    }, async ({page}) => {
        await restoreDatabaseSnapshot(SNAPSHOT);

        const headline = 'ordered list split test';

        await createArticle(page, headline);
        await typeThreeItemList(page);

        const listButton = getListButton(page);

        // The caret sits at the end of the third item. Counted arrow presses walk it back over
        // that item and across the block boundary into the second one.
        await pressRepeatedly(page, 'ArrowLeft', ITEM_THREE.length + 1);

        await expect(listButton).toHaveClass(ACTIVE_FORMATTING_BUTTON);
        await listButton.click();
        await expect(listButton).not.toHaveClass(ACTIVE_FORMATTING_BUTTON);

        // The third item ends up alone in a second <ol>, so it renumbers as that list's first item.
        const split: Array<IBlockGroup> = [
            {list: true, blocks: [ITEM_ONE]},
            {list: false, blocks: [ITEM_TWO]},
            {list: true, blocks: [ITEM_THREE]},
        ];

        await expectBody(page, split);

        await saveCloseAndReopen(page, headline);
        await expectBody(page, split);
    });

    test('backspace leaves an empty item, and a paragraph selection converts to a list', {
        annotation: ANNOTATION,
    }, async ({page}) => {
        await restoreDatabaseSnapshot(SNAPSHOT);

        const headline = 'ordered list backspace test';

        await createArticle(page, headline);

        const listButton = getListButton(page);

        await listButton.click();
        await expect(listButton).toHaveClass(ACTIVE_FORMATTING_BUTTON);

        await page.keyboard.type(ITEM_ONE);
        await page.keyboard.press('Enter');
        await page.keyboard.type(ITEM_TWO);
        await page.keyboard.press('Enter');
        await expectBody(page, [{list: true, blocks: [ITEM_ONE, ITEM_TWO, '']}]);

        await page.keyboard.press('Backspace');
        await expect(listButton).not.toHaveClass(ACTIVE_FORMATTING_BUTTON);
        await expectBody(page, [
            {list: true, blocks: [ITEM_ONE, ITEM_TWO]},
            {list: false, blocks: ['']},
        ]);

        await page.keyboard.type(PARAGRAPH_ONE);
        await page.keyboard.press('Enter');
        await page.keyboard.type(PARAGRAPH_TWO);
        await page.keyboard.press('Enter');
        await page.keyboard.type(PARAGRAPH_THREE);

        await expectBody(page, [
            {list: true, blocks: [ITEM_ONE, ITEM_TWO]},
            {list: false, blocks: [PARAGRAPH_ONE, PARAGRAPH_TWO, PARAGRAPH_THREE]},
        ]);
        await expect(listButton).not.toHaveClass(ACTIVE_FORMATTING_BUTTON);

        // Select the last two paragraphs backwards from the caret: over the third one, one press
        // to cross the block boundary, then over the second one.
        await pressRepeatedly(page, 'Shift+ArrowLeft', PARAGRAPH_THREE.length + 1 + PARAGRAPH_TWO.length);

        await listButton.click();
        await expect(listButton).toHaveClass(ACTIVE_FORMATTING_BUTTON);

        const converted: Array<IBlockGroup> = [
            {list: true, blocks: [ITEM_ONE, ITEM_TWO]},
            {list: false, blocks: [PARAGRAPH_ONE]},
            {list: true, blocks: [PARAGRAPH_TWO, PARAGRAPH_THREE]},
        ];

        await expectBody(page, converted);

        await saveCloseAndReopen(page, headline);
        await expectBody(page, converted);
    });
});
