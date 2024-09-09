import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('spiking and unspiking an article', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=story 2')),
        'Spike Item',
    );
    await page.locator(s('spike-modal')).getByRole('button', {name: 'spike'}).click();

    // check is article removed form monitoring
    await expect(page.locator(s('monitoring-view', 'article-item=story 2'))).not.toBeVisible();

    // go to spike item list and check visibility of article
    await page.goto('/#/workspace/spike-monitoring');
    await expect(page.locator(s('articles-list', 'article-item=story 2'))).toBeVisible();

    // unspike article
    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=story 2')),
        'Unspike Item',
    );
    await expect(page.locator(s('interactive-actions-panel'))).toBeVisible();
    await page.locator(s('interactive-actions-panel')).locator(s('item'), {hasText: 'Working Stage'}).check();
    await page.locator(s('interactive-actions-panel', 'unspike')).click();

    // go to monitoring and check visibility of article
    await page.goto('/#/workspace/monitoring');
    await expect(page.locator(s('monitoring-view', 'article-item=story 2'))).toBeVisible();
});

test('spiked view respecting the selected desk', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/spike-monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');
    await expect(page.locator(s('articles-list', 'article-item=Spiked article from sport desk'))).toBeVisible();
    await expect(page.locator(s('articles-list', 'article-item=Spiked article from education desk'))).not.toBeVisible();

    await monitoring.selectDeskOrWorkspace('Education');
    await expect(page.locator(s('articles-list', 'article-item=Spiked article from education desk'))).toBeVisible();
    await expect(page.locator(s('articles-list', 'article-item=Spiked article from sport desk'))).not.toBeVisible();
});
