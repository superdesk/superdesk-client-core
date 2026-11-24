import {test, expect} from '@playwright/test';
import {PackageAuthoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({storageState: getStorageState({}, {authoringReact: true})});

test('publishing a highlights package moves it to the desk output', {
    annotation: [
        {type: 'confluence', description: '1328906283 complete'}, // Publishing package
        {type: 'confluence', description: '1344443870 partial'}, // Check Publishing a package
        {type: 'confluence', description: '1311834317 complete'}, // Publish highlights package
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new PackageAuthoring(page);
    const working = monitoring.getGroupedArticleLocator('Sports / Working Stage', 'Package Highlight 1');
    const output = monitoring.getGroupedArticleLocator('Sports desk output', 'Package Highlight 1');

    await restoreDatabaseSnapshot();
    await monitoring.openMonitoringForDesk('Sports');

    await expect(working).toBeVisible();
    await expect(output).toHaveCount(0);

    await monitoring.executeActionOnMonitoringItem(working, 'Edit');
    await expect(authoring.fieldContainer('groups')).toBeVisible();

    await authoring.publish({subscribers: []});

    await expect(output).toBeVisible();
    await expect(working).toHaveCount(0);
});
