import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';

/**
 * QA case "Find and replace" (Authoring widgets, 1310294123).
 *
 * The widget finds every occurrence of the text typed in Find, replaces the
 * currently selected one with the text typed in Replace with, and replaces the
 * remaining ones in a single step through Replace All.
 *
 * Every documented expected result is covered. Case sensitivity and the
 * previous/next match controls are not part of the documented scenario and are
 * left out on purpose.
 *
 * The widget is exercised in authoring-angular, the default implementation, which
 * is what the case describes: it selects the first match as soon as a search term
 * is typed, so Replace acts on it right away.
 */
test.describe('find and replace widget', () => {
    const WIDGET = 'Find and Replace';
    const ORIGINAL_BODY = 'one apple two apple three apple four';
    const AFTER_SINGLE_REPLACE = 'one orange two apple three apple four';
    const AFTER_REPLACE_ALL = 'one orange two orange three orange four';

    /**
     * Matches are marked with editor3's HIGHLIGHT / HIGHLIGHT_STRONG styles, which
     * draft-js applies as an inline background colour on the leaf span. Those spans
     * carry no id of their own, so the colour is the only DOM signal that a match was
     * found; the opaque variant marks the currently selected match.
     */
    const MATCH_BACKGROUND = 'rgba(255, 235, 59';
    const SELECTED_MATCH_BACKGROUND = 'rgba(255, 235, 59, 0.8)';

    test('finds every occurrence, replaces the selected one, and replaces the rest at once', {
        annotation: [
            {type: 'confluence', description: '1310294123 complete'}, // Find and replace
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

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

        await setEditor3FieldValue(body, ORIGINAL_BODY);

        const widget = await authoring.openWidget(WIDGET);
        const matches = bodyField.locator(`span[style*="${MATCH_BACKGROUND}"]`);
        const selectedMatch = bodyField.locator(`span[style*="${SELECTED_MATCH_BACKGROUND}"]`);

        await widget.getByTestId('find-replace-find').fill('apple');

        // The Find field is debounced by 500ms in ng-model-options, so the highlights
        // only appear once that has elapsed; the retrying count assertion absorbs it.
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
});
