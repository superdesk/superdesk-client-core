import {test, expect, Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';

// QA case "Find and replace" (1310294123), plus previous/next match and Case Sensitive, which the
// widget has but the case does not list. Runs on authoring-angular, which selects the first match
// as soon as a term is typed, so Replace acts on it right away.
test.describe('find and replace widget', () => {
    const WIDGET = 'Find and Replace';
    const ORIGINAL_BODY = 'one apple two apple three apple four';
    const AFTER_SINGLE_REPLACE = 'one orange two apple three apple four';
    const AFTER_REPLACE_ALL = 'one orange two orange three orange four';

    // Match spans have no id; the draft-js inline background (HIGHLIGHT / HIGHLIGHT_STRONG) is the
    // only DOM signal. The opaque variant marks the selected match.
    const MATCH_BACKGROUND = 'rgba(255, 235, 59';
    const SELECTED_MATCH_BACKGROUND = 'rgba(255, 235, 59, 0.8)';

    async function openWidgetOnBody(page: Page, bodyText: string) {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.getArticleLocator('test sports story').dblclick();

        const bodyField = page.getByTestId('authoring')
            .getByTestId('authoring-field')
            .and(page.locator('[data-test-value="body_html"]'));
        const body = bodyField.getByRole('textbox');

        await expect(body).toBeVisible();

        await setEditor3FieldValue(body, bodyText);

        return {
            body,
            widget: await authoring.openWidget(WIDGET),
            matches: bodyField.locator(`span[style*="${MATCH_BACKGROUND}"]`),
            selectedMatch: bodyField.locator(`span[style*="${SELECTED_MATCH_BACKGROUND}"]`),
        };
    }

    test.beforeEach(async () => {
        await restoreDatabaseSnapshot();
    });

    test('finds every occurrence, replaces the selected one, and replaces the rest at once', {
        annotation: [
            {type: 'confluence', description: '1310294123 complete'}, // Find and replace
        ],
    }, async ({page}) => {
        const {body, widget, matches, selectedMatch} = await openWidgetOnBody(page, ORIGINAL_BODY);

        await widget.getByTestId('find-replace-find').fill('apple');

        // Find is debounced by 500ms, so highlights appear late; the retrying count absorbs it.
        await expect(matches).toHaveCount(3);
        await expect(selectedMatch).toHaveCount(1);
        await expect(selectedMatch).toHaveText('apple');

        await widget.getByTestId('find-replace-replace-with').fill('orange');
        await widget.getByTestId('find-replace-replace').click();

        await expect(body).toHaveText(AFTER_SINGLE_REPLACE);
        await expect(matches).toHaveCount(2);

        await widget.getByTestId('find-replace-replace-all').click();

        await expect(body).toHaveText(AFTER_REPLACE_ALL);
        await expect(matches).toHaveCount(0);
    });

    test('next and previous move the selected match, and Replace acts on it', async ({page}) => {
        const {body, widget, matches, selectedMatch} = await openWidgetOnBody(page, ORIGINAL_BODY);

        await widget.getByTestId('find-replace-find').fill('apple');

        await expect(matches).toHaveCount(3);
        await expect(selectedMatch).toHaveCount(1);
        await expect(matches.nth(0)).toHaveCSS('background-color', SELECTED_MATCH_BACKGROUND);

        await widget.getByTestId('find-replace-next').click();
        await expect(matches.nth(1)).toHaveCSS('background-color', SELECTED_MATCH_BACKGROUND);

        await widget.getByTestId('find-replace-next').click();
        await expect(matches.nth(2)).toHaveCSS('background-color', SELECTED_MATCH_BACKGROUND);

        await widget.getByTestId('find-replace-previous').click();
        await expect(matches.nth(1)).toHaveCSS('background-color', SELECTED_MATCH_BACKGROUND);
        await expect(selectedMatch).toHaveCount(1);

        await widget.getByTestId('find-replace-replace-with').fill('orange');
        await widget.getByTestId('find-replace-replace').click();

        await expect(body).toHaveText('one apple two orange three apple four');
        await expect(matches).toHaveCount(2);
        // Replace moves the selection on to the match after the replaced one.
        await expect(matches.nth(1)).toHaveCSS('background-color', SELECTED_MATCH_BACKGROUND);
    });

    test('Case Sensitive limits matches and Replace All to the exact case', async ({page}) => {
        const {body, widget, matches} = await openWidgetOnBody(page, 'one Apple two apple three apple four');
        const caseSensitive = widget.getByTestId('find-replace-case-sensitive');

        await widget.getByTestId('find-replace-find').fill('apple');

        // The switch starts on.
        await expect(caseSensitive).toHaveClass(/\bchecked\b/);
        await expect(matches).toHaveCount(2);
        await expect(matches).toHaveText(['apple', 'apple']);

        await caseSensitive.click();

        await expect(caseSensitive).not.toHaveClass(/\bchecked\b/);
        await expect(matches).toHaveCount(3);
        await expect(matches).toHaveText(['Apple', 'apple', 'apple']);

        await caseSensitive.click();

        await expect(caseSensitive).toHaveClass(/\bchecked\b/);
        await expect(matches).toHaveCount(2);

        await widget.getByTestId('find-replace-replace-with').fill('orange');
        await widget.getByTestId('find-replace-replace-all').click();

        await expect(body).toHaveText('one Apple two orange three orange four');
        await expect(matches).toHaveCount(0);
    });
});
