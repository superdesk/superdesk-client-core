import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {TreeSelectDriver} from './utils/tree-select-driver';

/**
 * Covers Confluence 1313669355 for `body_html` only. The case also asks for the
 * same checks on custom text fields, which no snapshot can provide: `main` holds
 * no custom field vocabulary, so there is no custom text field to put on the
 * Story content profile.
 */
test.describe('unordered list in the article body', () => {
    const FORMAT_OPTION = 'unordered list';
    const ACTIVE_BUTTON = /Editor3-activeButton/;

    const ANNOTATION = [
        // Unordered list
        {type: 'confluence', description: '1313669355 partial'},
    ];

    /**
     * A rendered Draft.js block, flattened for structural comparison.
     *
     * `list` is the position of the enclosing `<ul>` among the field's lists, so
     * two items with the same value are in the same list and different values mean
     * the list was split. `null` marks a block that is not a list item at all.
     */
    interface IBlock {
        text: string;
        list: number | null;
    }

    function readBlocks(body: Locator): Promise<Array<IBlock>> {
        return body.evaluate((field) => {
            const lists = Array.from(field.querySelectorAll('ul'));

            return Array.from(field.querySelectorAll('[data-block="true"]')).map((block) => {
                const list = block.closest('ul');

                return {
                    text: (block.textContent ?? '').trim(),
                    list: list == null ? null : lists.indexOf(list),
                };
            });
        });
    }

    async function expectBlocks(body: Locator, blocks: Array<IBlock>): Promise<void> {
        await expect.poll(() => readBlocks(body)).toEqual(blocks);
    }

    // "a bullet is displayed": the browser only paints a marker for a list-item box
    // whose list-style-type is not `none`. The exact glyph is a theme decision.
    async function expectBulletMarker(item: Locator): Promise<void> {
        const marker = await item.evaluate((element) => {
            const style = getComputedStyle(element);

            return {display: style.display, listStyleType: style.listStyleType};
        });

        expect(marker.display).toBe('list-item');
        expect(marker.listStyleType).not.toBe('none');
    }

    async function pressRepeatedly(page: Page, key: string, times: number): Promise<void> {
        for (let i = 0; i < times; i++) {
            await page.keyboard.press(key);
        }
    }

    /**
     * The Story content profile ships without the unordered list formatting option,
     * so the toolbar button does not render until it is enabled. Configuring the
     * profile is the same precondition `content-profile.spec.ts` builds through the
     * UI; the alternative would be a new database snapshot for one array entry.
     */
    async function enableUnorderedListFormatOption(page: Page): Promise<void> {
        await page.goto('/#/settings/content-profiles');

        await page.getByTestId('content-profile')
            .and(page.locator('[data-test-value="Story"]'))
            .getByTestId('content-profile-actions')
            .click();
        await page.getByTestId('content-profile-actions--options').getByRole('button', {name: 'Edit'}).click();

        const editModal = page.getByTestId('content-profile-editing-modal');

        await expect(editModal).toBeVisible();

        await editModal.getByTestId('content-profile-tabs').getByRole('tab', {name: 'Content fields'}).click();
        await editModal.getByTestId('content-profile-fields')
            .getByTestId('field')
            .and(page.locator('[data-test-value="Body HTML"]'))
            .click();

        const fieldEdit = page.getByTestId('item-view-edit');

        await expect(fieldEdit).toBeVisible();

        await new TreeSelectDriver(page, fieldEdit.getByTestId('formatting-options-input'))
            .addValues(FORMAT_OPTION);

        // A multi-value tree select keeps its popover open after a pick, and the
        // popover covers the panel's save button.
        await page.keyboard.press('Escape');

        await fieldEdit.getByTestId('item-view-edit--save').click();
        await editModal.getByRole('button', {name: 'Save'}).click();
        await expect(editModal).toBeHidden();
    }

    function getBody(page: Page): Locator {
        return page.getByTestId('authoring')
            .getByTestId('authoring-field')
            .and(page.locator('[data-test-value="body_html"]'));
    }

    function getHeadline(page: Page): Locator {
        return page.getByTestId('field--headline').getByRole('textbox');
    }

    function getListButton(page: Page): Locator {
        return getBody(page).getByTestId('toolbar')
            .getByTestId('formatting-option-button')
            .and(page.locator(`[data-test-value="${FORMAT_OPTION}"]`));
    }

    async function createArticle(page: Page, headline: string): Promise<void> {
        const monitoring = new Monitoring(page);

        await enableUnorderedListFormatOption(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.createArticleFromDefaultTemplate();

        const headlineField = getHeadline(page);

        await expect(headlineField).toBeVisible();
        await headlineField.fill(headline);
        await expect(headlineField).toHaveText(headline);

        const bodyInput = getBody(page).getByRole('textbox');

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();
    }

    /**
     * Closing an edited article raises the "Save changes?" prompt; saving from there
     * both persists the body and closes the article. Its Save is scoped to the
     * dialog so it does not collide with the topbar Save button.
     */
    async function saveAndReopen(page: Page, headline: string): Promise<void> {
        await page.getByTestId('authoring-topbar').getByTestId('close').click();
        await page.getByTestId('unsaved-changes-dialog')
            .getByRole('button', {name: 'Save', exact: true})
            .click();
        await expect(page.getByTestId('authoring-topbar')).toBeHidden();

        await new Monitoring(page).getArticleLocator(headline).dblclick();
        await expect(getBody(page).getByRole('textbox')).toBeVisible();
        await expect(getHeadline(page)).toHaveText(headline);
    }

    test('toggling the toolbar button starts a list, Enter adds items, toggling off ends the list', {
        annotation: ANNOTATION,
    }, async ({page}) => {
        const HEADLINE = 'unordered list - typing';
        const [FIRST, SECOND, THIRD] = ['alpha', 'bravo', 'charlie'];

        await restoreDatabaseSnapshot();
        await createArticle(page, HEADLINE);

        const body = getBody(page);
        const listButton = getListButton(page);

        await expect(listButton).not.toHaveClass(ACTIVE_BUTTON);

        await listButton.click();
        await expect(listButton).toHaveClass(ACTIVE_BUTTON);
        await expectBlocks(body, [{text: '', list: 0}]);
        await expectBulletMarker(body.locator('ul > li').first());

        await page.keyboard.type(FIRST);
        await expectBlocks(body, [{text: FIRST, list: 0}]);

        await page.keyboard.press('Enter');
        await expectBlocks(body, [{text: FIRST, list: 0}, {text: '', list: 0}]);
        await expectBulletMarker(body.locator('ul > li').nth(1));

        await page.keyboard.type(SECOND);
        await expectBlocks(body, [{text: FIRST, list: 0}, {text: SECOND, list: 0}]);

        await page.keyboard.press('Enter');
        await page.keyboard.type(THIRD);
        await expectBlocks(body, [
            {text: FIRST, list: 0},
            {text: SECOND, list: 0},
            {text: THIRD, list: 0},
        ]);
        await expect(listButton).toHaveClass(ACTIVE_BUTTON);

        await listButton.click();
        await expect(listButton).not.toHaveClass(ACTIVE_BUTTON);
        await expectBlocks(body, [
            {text: FIRST, list: 0},
            {text: SECOND, list: 0},
            {text: THIRD, list: null},
        ]);

        await saveAndReopen(page, HEADLINE);
        await expectBlocks(body, [
            {text: FIRST, list: 0},
            {text: SECOND, list: 0},
            {text: THIRD, list: null},
        ]);
    });

    test('toggling the button off on a middle item splits the list around a paragraph', {
        annotation: ANNOTATION,
    }, async ({page}) => {
        const HEADLINE = 'unordered list - split';
        const [FIRST, SECOND, THIRD] = ['delta', 'echo', 'foxtrot'];

        await restoreDatabaseSnapshot();
        await createArticle(page, HEADLINE);

        const body = getBody(page);
        const listButton = getListButton(page);

        await listButton.click();
        await page.keyboard.type(FIRST);
        await page.keyboard.press('Enter');
        await page.keyboard.type(SECOND);
        await page.keyboard.press('Enter');
        await page.keyboard.type(THIRD);
        await expectBlocks(body, [
            {text: FIRST, list: 0},
            {text: SECOND, list: 0},
            {text: THIRD, list: 0},
        ]);

        // Walk the caret back into the second item. Counted arrow presses rather than
        // Home/End, which do not move the caret on macOS; the extra press crosses the
        // block boundary.
        await pressRepeatedly(page, 'ArrowLeft', THIRD.length + 1);

        await expect(listButton).toHaveClass(ACTIVE_BUTTON);
        await listButton.click();
        await expect(listButton).not.toHaveClass(ACTIVE_BUTTON);

        await expectBlocks(body, [
            {text: FIRST, list: 0},
            {text: SECOND, list: null},
            {text: THIRD, list: 1},
        ]);

        await saveAndReopen(page, HEADLINE);
        await expectBlocks(body, [
            {text: FIRST, list: 0},
            {text: SECOND, list: null},
            {text: THIRD, list: 1},
        ]);
    });

    test('backspace leaves the list on an empty item, and a paragraph selection becomes a list', {
        annotation: ANNOTATION,
    }, async ({page}) => {
        const HEADLINE = 'unordered list - selection';
        const [FIRST, SECOND] = ['golf', 'hotel'];
        const [PARAGRAPH, LIFTED_FIRST, LIFTED_SECOND] = ['india', 'juliett', 'kilo'];

        await restoreDatabaseSnapshot();
        await createArticle(page, HEADLINE);

        const body = getBody(page);
        const listButton = getListButton(page);

        await listButton.click();
        await page.keyboard.type(FIRST);
        await page.keyboard.press('Enter');
        await page.keyboard.type(SECOND);
        await page.keyboard.press('Enter');
        await expectBlocks(body, [
            {text: FIRST, list: 0},
            {text: SECOND, list: 0},
            {text: '', list: 0},
        ]);

        await page.keyboard.press('Backspace');
        await expect(listButton).not.toHaveClass(ACTIVE_BUTTON);
        await expectBlocks(body, [
            {text: FIRST, list: 0},
            {text: SECOND, list: 0},
            {text: '', list: null},
        ]);

        await page.keyboard.type(PARAGRAPH);
        await page.keyboard.press('Enter');
        await page.keyboard.type(LIFTED_FIRST);
        await page.keyboard.press('Enter');
        await page.keyboard.type(LIFTED_SECOND);
        await expectBlocks(body, [
            {text: FIRST, list: 0},
            {text: SECOND, list: 0},
            {text: PARAGRAPH, list: null},
            {text: LIFTED_FIRST, list: null},
            {text: LIFTED_SECOND, list: null},
        ]);

        // Select the last two paragraphs, leaving the first one out of the selection.
        await pressRepeatedly(page, 'Shift+ArrowLeft', LIFTED_SECOND.length + 1 + LIFTED_FIRST.length);

        await expect(listButton).not.toHaveClass(ACTIVE_BUTTON);
        await listButton.click();
        await expect(listButton).toHaveClass(ACTIVE_BUTTON);

        await expectBlocks(body, [
            {text: FIRST, list: 0},
            {text: SECOND, list: 0},
            {text: PARAGRAPH, list: null},
            {text: LIFTED_FIRST, list: 1},
            {text: LIFTED_SECOND, list: 1},
        ]);

        await saveAndReopen(page, HEADLINE);
        await expectBlocks(body, [
            {text: FIRST, list: 0},
            {text: SECOND, list: 0},
            {text: PARAGRAPH, list: null},
            {text: LIFTED_FIRST, list: 1},
            {text: LIFTED_SECOND, list: 1},
        ]);
    });
});
