import {test, expect, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Info button" (Confluence 1310294120). Not covered:
 * - Keywords: shown read-only (under a "Word Count" label, a product bug) and no snapshot article has any.
 * - Expiry: no desk in the `main` snapshot has auto-expiry, so the line never renders for an editable article.
 * - Target Subscribers / Target types: not in the Info widget in the current UI.
 * The QA page contradicts itself on Not For Publication (publish fails vs. only tags the item). The client
 * hides the Publish tab for a flagged item (sdApi.article.canPublish); that is what is asserted.
 */
// Two article opens plus waiting for the unique name to be searchable exceed the 30s default.
test.setTimeout(90000);

test.describe('Info widget in authoring', () => {
    const ARTICLE = 'test sports story';
    const WORKING_STAGE = 'Sports / Working Stage';

    // Lower-case single token so the `term` filter on `unique_name` matches whether mapped as keyword or analysed.
    const UNIQUE_NAME = 'infowidgetstory';
    const USAGE_TERMS = 'internal briefing only';

    function articleInWorkingStage(page: Page) {
        return page.getByTestId('monitoring-group')
            .and(page.locator(`[data-test-value="${WORKING_STAGE}"]`))
            .getByTestId('article-item')
            .and(page.locator(`[data-test-value="${ARTICLE}"]`));
    }

    async function openArticleInfoWidget(page: Page) {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await articleInWorkingStage(page).dblclick();

        return authoring.openWidget('Info');
    }

    // No test ids on the panel toggle, parameters tab or submit button; located as in `search.spec.ts`.
    async function searchByUniqueName(page: Page, uniqueName: string): Promise<void> {
        await page.goto('/#/search');

        if (await page.getByTestId('repo--ingest').count() === 0) {
            await page.locator('.filter-trigger').click();
        }

        await expect(page.getByTestId('repo--ingest')).toBeVisible();

        await page.locator('#parameters-tab').click();
        await page.locator('#search-storyname').fill(uniqueName);

        // No client-side signal for the new unique name being indexed, so re-submit until it matches.
        await expect(async () => {
            await page.locator('#advanced_search_filters button.search:visible').first().click();
            await expect(page.getByTestId('article-item')).toHaveCount(1);
        }).toPass({timeout: 60000});

        await expect(page.getByTestId('article-item')).toContainText(ARTICLE);
    }

    test('lists the article identifiers and persists edits to Usage terms, Language and Unique name', {
        annotation: [
            {type: 'confluence', description: '1310294120 partial'}, // Info button
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const authoring = new Authoring(page);
        const infoWidget = await openArticleInfoWidget(page);

        await expect(infoWidget.getByTestId('guid')).toHaveText(/^urn:newsml:/);
        await expect(
            infoWidget.getByTestId('guid').locator('input, select, textarea, [contenteditable="true"]'),
        ).toHaveCount(0);
        // "unusable" contains "usable", so match the whole text, which is the label glued to the value.
        await expect(infoWidget.getByTestId('pubstatus')).toHaveText(/^Pubstatus\s*usable$/);
        await expect(infoWidget.getByTestId('state')).toContainText(/in progress/i);

        await infoWidget.getByTestId('usage-terms').fill(USAGE_TERMS);
        await infoWidget.getByTestId('language').locator('select').selectOption({label: 'Deutsch'});
        await infoWidget.getByTestId('unique-name').fill(UNIQUE_NAME);

        await authoring.closeAndSave();

        await articleInWorkingStage(page).dblclick();

        const reopenedInfoWidget = await authoring.openWidget('Info');

        await expect(reopenedInfoWidget.getByTestId('usage-terms')).toHaveValue(USAGE_TERMS);
        await expect(reopenedInfoWidget.getByTestId('language').locator('option:checked')).toHaveText('Deutsch');
        await expect(reopenedInfoWidget.getByTestId('unique-name')).toHaveValue(UNIQUE_NAME);

        await authoring.close();

        await searchByUniqueName(page, UNIQUE_NAME);
    });

    test('Not For Publication and Legal tag the item, and only Not For Publication blocks publishing', {
        annotation: [
            {type: 'confluence', description: '1310294120 partial'}, // Info button
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const authoring = new Authoring(page);
        const infoWidget = await openArticleInfoWidget(page);

        const notForPublication = infoWidget.getByTestId('not-for-publication');
        const legal = infoWidget.getByTestId('legal');

        // sd-switch exposes its on/off state as a class.
        await expect(notForPublication).not.toHaveClass(/checked/);
        await expect(legal).not.toHaveClass(/checked/);

        await notForPublication.click();
        await legal.click();

        await expect(notForPublication).toHaveClass(/checked/);
        await expect(legal).toHaveClass(/checked/);
        await expect(infoWidget.getByTestId('state')).toContainText('Not For Publication');
        await expect(infoWidget.getByTestId('state')).toContainText('Legal');

        await authoring.save();

        await expect(articleInWorkingStage(page)).toContainText('Not For Publication');
        await expect(articleInWorkingStage(page)).toContainText('Legal');

        const paneWithFlag = await authoring.openSendPublishPane();

        await expect(paneWithFlag.getByTestId('tabs').getByRole('tab', {name: 'Send to'})).toBeVisible();
        await expect(paneWithFlag.getByTestId('tabs').getByRole('tab', {name: 'Publish'})).toHaveCount(0);

        await authoring.closeSendPublishPane();

        await notForPublication.click();
        await expect(notForPublication).not.toHaveClass(/checked/);

        await authoring.save();

        await expect(articleInWorkingStage(page)).not.toContainText('Not For Publication');
        await expect(articleInWorkingStage(page)).toContainText('Legal');

        const paneWithoutFlag = await authoring.openSendPublishPane();

        await expect(paneWithoutFlag.getByTestId('tabs').getByRole('tab', {name: 'Publish'})).toBeVisible();
    });
});
