import {test, expect, Locator, Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Packages info" (Authoring widgets, 1310294130).
 *
 * The case documents a single expected result: with an article open for editing, the Packages
 * tab names the package that article belongs to. The first test asserts exactly that, so it
 * covers the case in full; the second is a negative variant the case does not describe and
 * therefore carries no case annotation of its own.
 *
 * The case illustrates it with a package headlined "GET YOUR PACKAGE HERE"; the `main` snapshot
 * carries the same shape under different names ("Story 3" is referenced by the composite item
 * "Package Highlight 1"), and the fixture names are what the assertions use.
 */

const ARTICLE_IN_PACKAGE = 'Story 3';
const ARTICLE_WITHOUT_PACKAGE = 'story 2';
const PACKAGE = 'Package Highlight 1';

function workingStageItem(page: Page, label: string): Locator {
    return page
        .getByTestId('monitoring-group')
        .and(page.locator('[data-test-value="Sports / Working Stage"]'))
        .getByTestId('article-item')
        .and(page.locator(`[data-test-value="${label}"]`));
}

async function openPackagesWidget(page: Page, label: string): Promise<Locator> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.executeActionOnMonitoringItem(workingStageItem(page, label), 'Edit');

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
        await expect(entries).toContainText(PACKAGE);
    });

    test('lists nothing for an article that belongs to no package', async ({page}) => {
        await restoreDatabaseSnapshot();

        const widget = await openPackagesWidget(page, ARTICLE_WITHOUT_PACKAGE);

        // The widget body is the anchor for the empty assertion below: without it, "no entries"
        // would also be true of a panel that never rendered.
        await expect(widget).toBeVisible();

        // Nothing can arrive late here. PackagesCtrl only queries the search endpoint when the
        // article carries `linked_in_packages` (scripts/apps/authoring/packages/packages.ts), and
        // this one does not, so the list stays empty for as long as the widget is open.
        await expect(widget.getByTestId('packages-list-item')).toHaveCount(0);
    });
});
