import {test, expect, Locator, Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

// Case names the package "GET YOUR PACKAGE HERE"; main has "Package Highlight 1" in its place.

const ARTICLE_IN_PACKAGE = 'Story 3';
const ARTICLE_WITHOUT_PACKAGE = 'story 2';
const PACKAGE = 'Package Highlight 1';

async function openPackagesWidget(page: Page, label: string): Promise<Locator> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator('Sports / Working Stage', label),
        'Edit',
    );

    await expect(page.getByTestId('authoring')).toBeVisible();

    const panel = await new Authoring(page).openWidget('Packages');

    return panel.getByTestId('packages-widget');
}

test.describe('packages widget', () => {
    test('names the package the open article belongs to', {
        annotation: [
            {type: 'confluence', description: '1310294130 complete'}, // Packages info
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const widget = await openPackagesWidget(page, ARTICLE_IN_PACKAGE);
        const entries = widget.getByTestId('packages-list-item');

        await expect(entries).toHaveCount(1);

        // The headline span is the only element of the entry with a `title`.
        const packageName = entries.locator('[title]');

        await expect(packageName).toBeVisible();
        await expect(packageName).toHaveText(PACKAGE);
    });

    test('lists nothing for an article that belongs to no package', async ({page}) => {
        await restoreDatabaseSnapshot();

        const widget = await openPackagesWidget(page, ARTICLE_WITHOUT_PACKAGE);

        // Visible first, so "no entries" is not also true of a panel that never rendered.
        await expect(widget).toBeVisible();

        // The widget only queries when the article has `linked_in_packages`, so an empty list is final.
        await expect(widget.getByTestId('packages-list-item')).toHaveCount(0);
    });
});
