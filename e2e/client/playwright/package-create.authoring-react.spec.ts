import {test, expect} from '@playwright/test';
import {PackageAuthoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

const WORKING_STAGE = 'Sports / Working Stage';

test.describe('creating a package (authoring-react)', () => {
    test('from the selected items with "Create Package"', async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);
        const authoring = new PackageAuthoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.multiSelect(monitoring.getGroupedArticleLocator(WORKING_STAGE, 'test sports story'));
        await monitoring.multiSelect(monitoring.getGroupedArticleLocator(WORKING_STAGE, 'story 2'));
        await monitoring.executeMultiAction('Create Package');

        await expect(authoring.groupItems('main')).toHaveCount(2);
        await expect(authoring.item('test sports story')).toBeVisible();
        await expect(authoring.item('story 2')).toBeVisible();
    });

    test('by combining an item with the open one', async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);
        const authoring = new PackageAuthoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.executeActionOnMonitoringItem(
            monitoring.getGroupedArticleLocator(WORKING_STAGE, 'story 2'),
            'Edit',
        );
        await expect(authoring.fieldContainer('body_html')).toBeVisible();

        await monitoring.executeActionOnMonitoringItem(
            monitoring.getGroupedArticleLocator(WORKING_STAGE, 'test sports story'),
            'Combine with current',
        );

        await expect(authoring.groupItems('main')).toHaveCount(2);
        await expect(authoring.item('test sports story')).toBeVisible();
        await expect(authoring.item('story 2')).toBeVisible();
    });

    test('from a published item found in global search', async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);
        const authoring = new PackageAuthoring(page);

        await page.goto('/#/search?repo=published');

        const publishedItem = page.getByTestId('article-item').and(page.locator('[data-test-value="Story 5"]'));

        await expect(publishedItem).toBeVisible();
        await monitoring.executeActionOnMonitoringItem(publishedItem, 'Create package');

        await expect(authoring.groupItems('main')).toHaveCount(1);
        await expect(authoring.item('Story 5')).toBeVisible();
        await expect(authoring.item('Story 5').getByTestId('package-item-state'))
            .toHaveAttribute('data-test-value', 'published');
    });
});
