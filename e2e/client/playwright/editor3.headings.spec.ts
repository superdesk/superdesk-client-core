import {test, expect, type Locator} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';
import {restoreDatabaseSnapshot} from './utils';
import {
    EDITOR3_ACTIVE_BUTTON,
    getEditor3Field,
    getEditor3FormattingOptionButton,
    pressRepeatedly,
} from './utils/editor3';

test.describe('heading formatting in the article body', () => {
    type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

    // Draft.js renders every block as the element its block type maps to, tagged with
    // `data-block`. Headings map to their own tag, an unstyled block to a `div`.
    type BlockTag = HeadingTag | 'div';

    const REGULAR_TAG: BlockTag = 'div';

    // The formatting-option id the toolbar button carries in `data-test-value` and the tag
    // the block is rendered as are separate namespaces that only coincide for headings, so
    // they are kept as separate constants.
    const HEADING_OPTION = 'h2';
    const HEADING_TAG: BlockTag = 'h2';

    const HEADING_TAGS: Array<HeadingTag> = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    function blockWithText(body: Locator, tag: BlockTag, text: string): Locator {
        return body.locator(`${tag}[data-block="true"]`).filter({hasText: text});
    }

    async function expectBlockTag(body: Locator, tag: BlockTag, text: string): Promise<void> {
        await expect(blockWithText(body, tag, text)).toHaveCount(1);
    }

    test('toolbar toggle makes typed text and a selection a heading, and the result survives reopen', {
        annotation: [
            // Drives the full toggle cycle (steps 2-7) for H2, the only level the `main` snapshot
            // enables; the test below applies the other five levels but does not repeat the
            // off-toggle and selection steps for them.
            {type: 'confluence', description: '1313669351 complete'}, // Headings H1-H6
        ],
    }, async ({page}) => {
        const HEADLINE = 'heading formatting test';

        // Each stretch of text is typed as two halves, so "select part of the text" is
        // a fixed number of Shift+Arrow presses and each half is addressable on its own.
        const TYPED_HEADING = 'alpha';
        const TYPED_REGULAR = 'bravo';
        const HEADING_HEAD = 'charlie';
        const HEADING_TAIL = 'delta';
        const REGULAR_HEAD = 'echo';
        const REGULAR_TAIL = 'foxtrot';

        await restoreDatabaseSnapshot();

        const authoring = new Authoring(page);
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.createArticleFromDefaultTemplate();

        const headline = page.getByTestId('field--headline').getByRole('textbox');

        await expect(headline).toBeVisible();
        await headline.fill(HEADLINE);
        await expect(headline).toHaveText(HEADLINE);

        const body = getEditor3Field(page, 'body_html');
        const bodyInput = body.getByRole('textbox');
        const headingButton = getEditor3FormattingOptionButton(body, HEADING_OPTION);

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();

        await expect(headingButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await headingButton.click();
        await expect(headingButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);

        await page.keyboard.type(TYPED_HEADING);
        await expectBlockTag(body, HEADING_TAG, TYPED_HEADING);

        await headingButton.click();
        await expect(headingButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);

        await page.keyboard.type(TYPED_REGULAR);
        await expectBlockTag(body, REGULAR_TAG, TYPED_REGULAR);
        await expect(body.locator(`${HEADING_TAG}[data-block="true"]`)).toHaveCount(0);

        await page.keyboard.press('Enter');

        await headingButton.click();
        await expect(headingButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);

        await page.keyboard.type(HEADING_HEAD + HEADING_TAIL);
        await expectBlockTag(body, HEADING_TAG, HEADING_HEAD);

        // The caret sits at the end of the heading; select its second half. A heading is a
        // block style, so toggling it off over that selection converts the whole paragraph.
        await pressRepeatedly(page, 'Shift+ArrowLeft', HEADING_TAIL.length);

        await expect(headingButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await headingButton.click();
        await expect(headingButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectBlockTag(body, REGULAR_TAG, HEADING_TAIL);
        await expectBlockTag(body, REGULAR_TAG, HEADING_HEAD);

        // ArrowRight collapses the selection to its end, which is the end of the
        // paragraph; Enter then starts a new one.
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');

        await page.keyboard.type(REGULAR_HEAD + REGULAR_TAIL);
        await expectBlockTag(body, REGULAR_TAG, REGULAR_HEAD);

        await pressRepeatedly(page, 'Shift+ArrowLeft', REGULAR_TAIL.length);

        await expect(headingButton).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await headingButton.click();
        await expect(headingButton).toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await expectBlockTag(body, HEADING_TAG, REGULAR_TAIL);
        await expectBlockTag(body, HEADING_TAG, REGULAR_HEAD);

        await authoring.closeSavingChanges();

        await monitoring.getArticleLocator(HEADLINE).dblclick();
        await expect(bodyInput).toBeVisible();

        await expect(headline).toHaveText(HEADLINE);
        await expectBlockTag(body, REGULAR_TAG, TYPED_HEADING);
        await expectBlockTag(body, REGULAR_TAG, TYPED_REGULAR);
        await expectBlockTag(body, REGULAR_TAG, HEADING_HEAD);
        await expectBlockTag(body, REGULAR_TAG, HEADING_TAIL);
        await expectBlockTag(body, HEADING_TAG, REGULAR_HEAD);
        await expectBlockTag(body, HEADING_TAG, REGULAR_TAIL);
    });

    test('every heading level H1-H6 applies its own tag, and the result survives reopen', {
        annotation: [
            // Covers applying each of the six heading levels and its persistence; the off-toggle
            // and selection-based steps are covered for H2 only, in the test above.
            {type: 'confluence', description: '1313669351 complete'}, // Headings H1-H6
        ],
    }, async ({page}) => {
        const HEADLINE = 'heading levels test';
        const textFor = (tag: HeadingTag): string => `heading level ${tag}`;

        await restoreDatabaseSnapshot();

        const authoring = new Authoring(page);
        const monitoring = new Monitoring(page);

        // `main` lists only h2 among the Story profile's body_html formatting options, so the
        // other five heading buttons do not render until the profile is told to offer them.
        await page.goto('/#/settings/content-profiles');
        await new ContentProfileSettings(page).addFormattingOptionToContentProfile({
            profileName: 'Story',
            sectionName: 'Content fields',
            fieldName: 'Body HTML',
            formattingOptionsToAdd: [...HEADING_TAGS],
        });

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.createArticleFromDefaultTemplate();

        const headline = page.getByTestId('field--headline').getByRole('textbox');

        await expect(headline).toBeVisible();
        await headline.fill(HEADLINE);
        await expect(headline).toHaveText(HEADLINE);

        const body = getEditor3Field(page, 'body_html');
        const bodyInput = body.getByRole('textbox');

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();

        for (const tag of HEADING_TAGS) {
            await expect(getEditor3FormattingOptionButton(body, tag)).toBeVisible();
        }

        for (let index = 0; index < HEADING_TAGS.length; index++) {
            const tag = HEADING_TAGS[index];
            const button = getEditor3FormattingOptionButton(body, tag);

            if (index > 0) {
                // Enter splits off a new block that keeps the previous heading level, so the
                // click below switches level rather than turning a heading on from scratch.
                await page.keyboard.press('Enter');
            }

            await button.click();
            await expect(button).toHaveClass(EDITOR3_ACTIVE_BUTTON);

            await page.keyboard.type(textFor(tag));
            await expectBlockTag(body, tag, textFor(tag));
        }

        await authoring.closeSavingChanges();

        await monitoring.getArticleLocator(HEADLINE).dblclick();
        await expect(bodyInput).toBeVisible();

        await expect(headline).toHaveText(HEADLINE);

        for (const tag of HEADING_TAGS) {
            await expectBlockTag(body, tag, textFor(tag));
        }
    });
});
