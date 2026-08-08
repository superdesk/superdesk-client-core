import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';
import {restoreDatabaseSnapshot} from './utils';

test.describe('ordered list in the article body', () => {
    const ITEM_ONE = 'alpha';
    const ITEM_TWO = 'bravo';
    const ITEM_THREE = 'charlie';

    const PARAGRAPH_ONE = 'delta';
    const PARAGRAPH_TWO = 'echo';
    const PARAGRAPH_THREE = 'foxtrot';

    const ACTIVE_BUTTON = /Editor3-activeButton/;

    interface IBlockGroup {
        list: boolean;
        blocks: Array<string>;
    }

    function getBody(page: Page): Locator {
        return page.getByTestId('authoring')
            .getByTestId('authoring-field')
            .and(page.locator('[data-test-value="body_html"]'));
    }

    function getListButton(page: Page): Locator {
        return getBody(page).getByTestId('toolbar')
            .getByTestId('formatting-option-button')
            .and(page.locator('[data-test-value="ordered list"]'));
    }

    /**
     * Draft.js groups every run of consecutive same-type blocks under one wrapper: an `<ol>` for
     * list items, a `<div class="unstyled">` for paragraphs. Reading those wrappers in document
     * order, each with the text of its blocks, is what says where a list starts and ends and which
     * item is which.
     *
     * The visible "1." / "2." ordinals come from Draft's CSS counters on `::before`, and Chromium
     * reports `content` with the `counter()` unresolved, so they cannot be read back. An item's
     * position inside its own `<ol>` is the same fact expressed in the DOM.
     */
    function readBody(page: Page): Promise<Array<IBlockGroup>> {
        return getBody(page).locator('[data-contents="true"]').first().evaluate((contents) =>
            Array.from(contents.children).map((group) => ({
                list: group.tagName === 'OL',
                blocks: Array.from(group.querySelectorAll('[data-block="true"]'))
                    .map((block) => block.textContent ?? ''),
            })),
        );
    }

    async function expectBody(page: Page, expected: Array<IBlockGroup>): Promise<void> {
        await expect.poll(() => readBody(page)).toEqual(expected);
    }

    async function pressRepeatedly(page: Page, key: string, times: number): Promise<void> {
        for (let i = 0; i < times; i++) {
            await page.keyboard.press(key);
        }
    }

    /**
     * The `main` snapshot's Story profile does not offer "ordered list" on body_html, so the
     * toolbar button the case drives has to be enabled on the content profile first.
     */
    async function enableOrderedListOnBody(page: Page): Promise<void> {
        await page.goto('/#/settings/content-profiles');
        await new ContentProfileSettings(page).addFormattingOptionToContentProfile({
            profileName: 'Story',
            sectionName: 'Content fields',
            fieldName: 'Body HTML',
            formattingOptionsToAdd: ['ordered list'],
        });
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

        await expect(listButton).not.toHaveClass(ACTIVE_BUTTON);
        await listButton.click();
        await expect(listButton).toHaveClass(ACTIVE_BUTTON);
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

        await expect(listButton).toHaveClass(ACTIVE_BUTTON);
    }

    /**
     * Closing an edited article raises the "Save changes?" prompt; saving from there both persists
     * the body and closes the article. Its Save is scoped to the dialog so it does not collide
     * with the topbar Save button.
     */
    async function saveCloseAndReopen(page: Page, headline: string): Promise<void> {
        await page.getByTestId('authoring-topbar').getByTestId('close').click();
        await page.getByTestId('unsaved-changes-dialog')
            .getByRole('button', {name: 'Save', exact: true})
            .click();
        await expect(page.getByTestId('authoring-topbar')).toBeHidden();

        await new Monitoring(page).getArticleLocator(headline).dblclick();
        await expect(getBody(page).getByRole('textbox')).toBeVisible();
        await expect(page.getByTestId('field--headline').getByRole('textbox')).toHaveText(headline);
    }

    // Partial: only body_html is covered. The case's description also names custom text fields,
    // which no snapshot puts on the Story content profile.
    const ANNOTATION = [
        {type: 'confluence', description: '1313669357 partial'}, // Ordered list
    ];

    test('toolbar toggle starts a list, Enter adds items, toggling off drops the last one', {
        annotation: ANNOTATION,
    }, async ({page}) => {
        await restoreDatabaseSnapshot();
        await enableOrderedListOnBody(page);

        const headline = 'ordered list typing test';

        await createArticle(page, headline);
        await typeThreeItemList(page);

        const listButton = getListButton(page);

        await listButton.click();
        await expect(listButton).not.toHaveClass(ACTIVE_BUTTON);

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
        await restoreDatabaseSnapshot();
        await enableOrderedListOnBody(page);

        const headline = 'ordered list split test';

        await createArticle(page, headline);
        await typeThreeItemList(page);

        const listButton = getListButton(page);

        // The caret sits at the end of the third item. Counted arrow presses walk it back over
        // that item and across the block boundary into the second one; Home does not move the
        // caret on macOS.
        await pressRepeatedly(page, 'ArrowLeft', ITEM_THREE.length + 1);

        await expect(listButton).toHaveClass(ACTIVE_BUTTON);
        await listButton.click();
        await expect(listButton).not.toHaveClass(ACTIVE_BUTTON);

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
        await restoreDatabaseSnapshot();
        await enableOrderedListOnBody(page);

        const headline = 'ordered list backspace test';

        await createArticle(page, headline);

        const listButton = getListButton(page);

        await listButton.click();
        await expect(listButton).toHaveClass(ACTIVE_BUTTON);

        await page.keyboard.type(ITEM_ONE);
        await page.keyboard.press('Enter');
        await page.keyboard.type(ITEM_TWO);
        await page.keyboard.press('Enter');
        await expectBody(page, [{list: true, blocks: [ITEM_ONE, ITEM_TWO, '']}]);

        await page.keyboard.press('Backspace');
        await expect(listButton).not.toHaveClass(ACTIVE_BUTTON);
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
        await expect(listButton).not.toHaveClass(ACTIVE_BUTTON);

        // Select the last two paragraphs backwards from the caret: over the third one, one press
        // to cross the block boundary, then over the second one.
        await pressRepeatedly(page, 'Shift+ArrowLeft', PARAGRAPH_THREE.length + 1 + PARAGRAPH_TWO.length);

        await listButton.click();
        await expect(listButton).toHaveClass(ACTIVE_BUTTON);

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
