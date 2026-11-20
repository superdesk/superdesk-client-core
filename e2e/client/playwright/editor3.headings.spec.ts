import {test, expect, type Locator, type Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {
    EDITOR3_ACTIVE_BUTTON,
    getEditor3Field,
    getEditor3FormattingOptionButton,
    pressRepeatedly,
} from './utils/editor3';

// A run takes about 15s; a failing 15s assertion after the reopen must still report itself
// rather than the test timeout.
test.setTimeout(60000);

test.describe('heading formatting in editor3 fields', () => {
    type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

    // Draft.js renders every block as the element its block type maps to, tagged with
    // `data-block`. Headings map to their own tag, an unstyled block to a `div`. For
    // headings the formatting-option id on the toolbar button and the rendered tag coincide.
    type BlockTag = HeadingTag | 'div';

    const REGULAR_TAG: BlockTag = 'div';

    const HEADING_TAGS: Array<HeadingTag> = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    // `editor3-formats` enables all six heading levels on the Story profile's body_html and
    // on its custom editor3 text field, which the Angular authoring view keys by display name.
    const SNAPSHOT = {snapshotName: 'editor3-formats'};
    const CUSTOM_FIELD = 'Sample rich text';

    function blockWithText(field: Locator, tag: BlockTag, text: string): Locator {
        return field.locator(`${tag}[data-block="true"]`).filter({hasText: text});
    }

    async function expectBlockTag(field: Locator, tag: BlockTag, text: string): Promise<void> {
        await expect(blockWithText(field, tag, text)).toHaveCount(1);
    }

    // A heading is a block style, so a collapsed caret would convert the block just the same;
    // checking the selection keeps the "select part of the text" step observable.
    async function selectTail(page: Page, tail: string): Promise<void> {
        await pressRepeatedly(page, 'Shift+ArrowLeft', tail.length);
        await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe(tail);
    }

    // Each stretch of text is typed as two halves, so "select part of the text" is a fixed
    // number of Shift+Arrow presses and each half is addressable on its own. The level is
    // part of every text so the blocks of the six cycles stay distinguishable.
    function textsFor(tag: HeadingTag) {
        return {
            typedHeading: `alpha${tag}`,
            typedRegular: `bravo${tag}`,
            regularHead: `charlie${tag}`,
            regularTail: `delta${tag}`,
            headingHead: `echo${tag}`,
            headingTail: `foxtrot${tag}`,
        };
    }

    function expectedTagsFor(tag: HeadingTag): Array<[BlockTag, string]> {
        const texts = textsFor(tag);

        return [
            [REGULAR_TAG, texts.typedHeading],
            [REGULAR_TAG, texts.typedRegular],
            [tag, texts.regularHead],
            [tag, texts.regularTail],
            [REGULAR_TAG, texts.headingHead],
            [REGULAR_TAG, texts.headingTail],
        ];
    }

    async function runHeadingCycle(page: Page, field: Locator, tag: HeadingTag): Promise<void> {
        const button = getEditor3FormattingOptionButton(field, tag);
        const texts = textsFor(tag);

        await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await button.click();
        await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);

        await page.keyboard.type(texts.typedHeading);
        await expectBlockTag(field, tag, texts.typedHeading);

        // A heading is a block style, so turning it off converts the block the caret is in,
        // including the text already typed into it.
        await button.click();
        await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);

        await page.keyboard.type(texts.typedRegular);
        await expectBlockTag(field, REGULAR_TAG, texts.typedRegular);
        await expect(field.locator(`${tag}[data-block="true"]`)).toHaveCount(0);

        await page.keyboard.press('Enter');

        await page.keyboard.type(texts.regularHead + texts.regularTail);
        await expectBlockTag(field, REGULAR_TAG, texts.regularHead);

        await selectTail(page, texts.regularTail);

        await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await button.click();
        await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectBlockTag(field, tag, texts.regularTail);

        // Enter at the end of a heading starts a new block that keeps the heading level.
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);

        await page.keyboard.type(texts.headingHead + texts.headingTail);
        await expectBlockTag(field, tag, texts.headingHead);

        await selectTail(page, texts.headingTail);

        await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await button.click();
        await expect(button).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectBlockTag(field, REGULAR_TAG, texts.headingTail);

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
    }

    async function runHeadingsCase(page: Page, fieldId: string, headline: string): Promise<void> {
        await restoreDatabaseSnapshot(SNAPSHOT);

        const authoring = new Authoring(page);
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        // Wait for the restored index so a stale article from a previous run cannot be opened.
        await expect(monitoring.getArticleLocator('test sports story')).toBeVisible();
        await expect(monitoring.getArticleLocator(headline)).toHaveCount(0);

        await monitoring.createArticleFromDefaultTemplate();

        const headlineInput = page.getByTestId('field--headline').getByRole('textbox');

        await expect(headlineInput).toBeVisible();
        await headlineInput.fill(headline);
        await expect(headlineInput).toHaveText(headline);

        const field = getEditor3Field(page, fieldId);
        const input = field.getByRole('textbox');

        await expect(input).toBeVisible();
        await input.click();

        for (const tag of HEADING_TAGS) {
            await runHeadingCycle(page, field, tag);
        }

        await authoring.closeSavingChanges();

        await monitoring.getArticleLocator(headline).dblclick();
        await expect(input).toBeVisible();

        await expect(headlineInput).toHaveText(headline);

        for (const tag of HEADING_TAGS) {
            for (const [blockTag, text] of expectedTagsFor(tag)) {
                await expectBlockTag(field, blockTag, text);
            }
        }
    }

    test('every heading level H1-H6 toggles on typed text and a selection in the body, and survives reopen', {
        annotation: [
            {type: 'confluence', description: '1313669351 complete'}, // Headings H1-H6
        ],
    }, async ({page}) => {
        await runHeadingsCase(page, 'body_html', 'heading formatting test');
    });

    test('every heading level H1-H6 toggles on typed text and a selection in a custom field, and survives reopen', {
        annotation: [
            {type: 'confluence', description: '1313669351 complete'}, // Headings H1-H6
        ],
    }, async ({page}) => {
        await runHeadingsCase(page, CUSTOM_FIELD, 'heading custom field test');
    });
});
