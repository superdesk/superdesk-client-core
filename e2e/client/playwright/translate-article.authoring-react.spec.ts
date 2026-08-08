import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

/**
 * QA case "Translations" (1344444573). Its only linked test case is "Translate item" (5707530482,
 * space SDFIL), which carries the steps and the expected results.
 *
 * Not covered, with the blocker for each:
 * - Steps 1-2 of the case: build an Edition package on a Creation desk, send it to a Circulation
 *   desk, publish it, and translate from that desk's Output. Blocker: Creation/Circulation desks
 *   and Editions are Superdesk Fidelity configuration that the e2e instance does not have, which
 *   is also why the parent page says translation workflows are customer specific. The translate
 *   action itself is the same one, reached from the same three-dot menu.
 * - "duplicated in the same desk and stage as the original" as a general claim. Blocker: the
 *   product never reads the original's stage. The client posts the *current* desk (`translate` in
 *   scripts/api/article.ts) and the server files the copy in that desk's `working_stage`
 *   (apps/duplication/archive_translate.py in superdesk-core). Original and copy share a stage
 *   here only because "test sports story" already sits in the Sports working stage.
 *
 * The case words the second expected result as a list label ("as an original English item is
 * marked by EN"). The default list config renders no language field (`DEFAULT_LIST_CONFIG` in
 * scripts/apps/search/constants.ts), so the language code is asserted where this product does
 * show it without customer config: the translations side widget.
 */

const ARTICLE = 'test sports story';
const TARGET_LANGUAGE = {label: 'Deutsch', code: 'de'};

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test.describe('translate article', () => {
    test('translates an article into another language from the monitoring actions menu', {
        annotation: [
            {type: 'confluence', description: '1344444573 partial'}, // Translations / Translate item
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        // the copy keeps the original's headline, so counting this locator is what shows the
        // translation landed in the same desk and stage rather than somewhere else
        const copiesInWorkingStage = page
            .getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'))
            .getByTestId('article-item')
            .and(page.locator(`[data-test-value="${ARTICLE}"]`));

        await expect(copiesInWorkingStage).toHaveCount(1);

        const [response] = await Promise.all([
            page.waitForResponse(
                (r) => r.url().endsWith('/archive/translate') && r.request().method() === 'POST',
            ),
            monitoring.executeSubmenuAction(copiesInWorkingStage, 'Translate', TARGET_LANGUAGE.label),
        ]);

        expect(response.status()).toBe(201);

        // TranslationService.set opens the new item in authoring once the POST resolves, so the
        // header below belongs to the translation, not to the article the menu was opened on
        await expect(page.getByTestId('authoring-header-translated-from'))
            .toHaveAttribute('data-test-value', 'en');

        await page.getByTestId('authoring-header-translations-count').click();

        const chain = page.getByTestId('translations-widget').getByTestId('translation-item');

        await expect(chain).toHaveCount(2);
        await expect(chain.and(page.locator('[data-test-value="en"]'))).toHaveCount(1);
        await expect(chain.and(page.locator(`[data-test-value="${TARGET_LANGUAGE.code}"]`))).toHaveCount(1);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await expect(copiesInWorkingStage).toHaveCount(2);
    });
});
