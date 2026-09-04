import {test, expect, Locator} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

async function multiSelect(article: Locator): Promise<void> {
    // The article list checkbox is rendered as a <button role="checkbox">,
    // so .check() won't work — the type-icon swaps to the SelectBox only on
    // hover (or when already selected), so we hover first.
    await article.locator(s('item-type-and-multi-select')).hover();
    const checkbox = article.locator(s('multi-select-checkbox'));

    await expect(checkbox).toBeVisible();
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
}

async function clickBulkAction(page: import('@playwright/test').Page, label: string): Promise<void> {
    // The multi-action bar renders either as multi-actions-inline (wide layout)
    // or multi-actions-dropdown (compact). Wait generously: the bar shows up
    // once an AngularJS digest cycle picks up multi.toggle from the React click.
    const inline = page.locator(s('multi-actions-inline', label));
    const compactToggle = page.locator(s('multi-actions-dropdown', 'dropdown-toggle'));

    await expect(inline.or(compactToggle)).toBeVisible({timeout: 30000});

    if ((await inline.count()) > 0) {
        await inline.click();
    } else {
        await compactToggle.click();
        await page.locator(s('multi-actions-dropdown', label)).click();
    }
}

test('can spike item from personal workspace', {
    annotation: [
        {type: 'confluence', description: '1311835214 partial'}, // Spike item from Personal space
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/personal');

    const monitoring = new Monitoring(page);
    const article = page.locator(s('monitoring-group=Personal Items', 'article-item=personal space article 1'));

    await expect(article).toBeVisible();

    await monitoring.executeActionOnMonitoringItem(article, 'Spike Item');

    // Personal-space single spike opens a generic confirm modal,
    // not the production-desk show-spike-dialog.
    await page.locator(s('modal-confirm')).getByRole('button', {name: /ok/i}).click();

    await expect(article).not.toBeVisible();
});

test('can spike and unspike multiple items via the multi-action bar', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    const monitoring = new Monitoring(page);

    await monitoring.selectDeskOrWorkspace('Sports');

    const itemA = page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'));
    const itemB = page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2'));

    await expect(itemA).toBeVisible();
    await expect(itemB).toBeVisible();

    await multiSelect(itemA);
    await multiSelect(itemB);

    await clickBulkAction(page, 'Spike');
    await page.locator(s('spike-modal')).getByRole('button', {name: 'Spike'}).click();

    await expect(itemA).not.toBeVisible();
    await expect(itemB).not.toBeVisible();

    await page.goto('/#/workspace/spike-monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const spikedA = page.locator(s('articles-list', 'article-item=test sports story'));
    const spikedB = page.locator(s('articles-list', 'article-item=story 2'));

    await expect(spikedA).toBeVisible();
    await expect(spikedB).toBeVisible();

    await multiSelect(spikedA);
    await multiSelect(spikedB);

    await clickBulkAction(page, 'Unspike');

    await expect(page.locator(s('interactive-actions-panel'))).toBeVisible();
    await page
        .locator(s('interactive-actions-panel'))
        .locator(s('item'), {hasText: 'Working Stage'})
        .check();
    await page.locator(s('interactive-actions-panel', 'unspike')).click();

    await expect(spikedA).not.toBeVisible();
    await expect(spikedB).not.toBeVisible();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await expect(itemA).toBeVisible();
    await expect(itemB).toBeVisible();
});
