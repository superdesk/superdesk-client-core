import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

/**
 * QA case "Translations" (1344444573), test case "Translate item" (5707530482).
 * Not covered: steps 1-2 (Edition package, Creation/Circulation desks) are Superdesk Fidelity config the e2e
 * instance lacks, so translation starts from the Sports desk. The copy goes to the current desk's working stage
 * (`translate` in scripts/api/article.ts), never the original's stage. The language is asserted in the
 * translations widget because the default list config renders no language field.
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

        // the copy keeps the original's headline, so the count shows where it landed
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

        // TranslationService.set opens the new item once the POST resolves, so this header is the copy's
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
