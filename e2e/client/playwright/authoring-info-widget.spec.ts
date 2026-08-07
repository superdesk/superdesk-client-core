import {test, expect, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Info button" (Authoring widgets, Confluence 1310294120).
 *
 * The Info side widget of an article: the Not For Publication and Legal flags,
 * the editable Usage terms / Language / Unique name fields, and the read-only
 * Pubstatus, State and GUID lines.
 *
 * Documented expected results that are NOT covered here, each with its blocker:
 *
 * - Keywords. The widget renders keywords read-only (and under a "Word Count"
 *   label, which is a product-side labelling bug), there is no keywords input in
 *   it, and no article in the `main` snapshot carries keywords.
 * - Expiry. Only the spiked articles in the `main` snapshot carry an `expiry`,
 *   and no desk in it has content auto-expiry configured, so the Expiry line
 *   never renders for an editable article.
 * - Target Subscribers / Target types. Not part of the Info widget in the
 *   current UI; the targeting controls live in the publish pane and in the
 *   template editor.
 *
 * The QA page contradicts itself on Not For Publication: the field description
 * says a publish attempt fails while the flag is on, a note at the end says the
 * flag only tags the item. The client implements the first one (the Publish tab
 * is not offered for a flagged item, see sdApi.article.canPublish), and that is
 * what is asserted below.
 */
// Both tests open the article twice and the first one also waits for the edited
// unique name to become searchable, which does not fit the 30s default.
test.setTimeout(90000);

test.describe('Info widget in authoring', () => {
    const ARTICLE = 'test sports story';
    const WORKING_STAGE = 'Sports / Working Stage';

    // Lower-case single token so the Advanced Search `term` filter on
    // `unique_name` matches regardless of whether the field is mapped as a
    // keyword or as an analysed string.
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

    /**
     * The Advanced Search parameters live in the search view's filter panel.
     * The panel toggle, the tab and the submit button have no test ids, so they
     * are located the same way `search.spec.ts` already does it.
     */
    async function searchByUniqueName(page: Page, uniqueName: string): Promise<void> {
        await page.goto('/#/search');

        if (await page.getByTestId('repo--ingest').count() === 0) {
            await page.locator('.filter-trigger').click();
        }

        await expect(page.getByTestId('repo--ingest')).toBeVisible();

        await page.locator('#parameters-tab').click();
        await page.locator('#search-storyname').fill(uniqueName);

        // The just-saved unique name has to be indexed before the term filter can
        // match it, and there is no client-side signal for that, so re-submit the
        // search until the result shows up.
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

        // The GUID is documented as not editable: it renders as plain text, with
        // no form control and nothing content-editable inside it.
        await expect(infoWidget.getByTestId('guid')).toHaveText(/^urn:newsml:/);
        await expect(
            infoWidget.getByTestId('guid').locator('input, select, textarea, [contenteditable="true"]'),
        ).toHaveCount(0);
        await expect(infoWidget.getByTestId('pubstatus')).toContainText('usable');
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

        // sd-switch renders a span that carries its on/off state as a class.
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
