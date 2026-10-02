import {test, expect, Locator, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

function authoringField(page: Page, fieldId: string): Locator {
    return page.getByTestId('authoring')
        .getByTestId('authoring-field')
        .and(page.locator(`[data-test-value="${fieldId}"]`));
}

const mediaItems = [
    {headline: 'Rivendell picture', type: 'picture'},
    {headline: 'Isengard video', type: 'video'},
    {headline: 'Lothlorien audio', type: 'audio'},
];

for (const {headline, type} of mediaItems) {
    test(`a ${type} item opens in authoring-react without the profile dropdown`, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.executeActionOnMonitoringItem(monitoring.getArticleLocator(headline), 'Edit');

        // Only authoring-react renders `_media_self`, so this proves the editor opened.
        await expect(authoringField(page, '_media_self')).toBeVisible();
        await expect(page.getByTestId('item-type-icon')).toHaveAttribute('data-test-value', type);
        await expect(page.getByTestId('content-profile-select')).toHaveCount(0);
    });
}
