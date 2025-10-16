import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({
        features: {
            customAuthoringTopbar: {
                sendAndDuplicate: {
                    deskName: 'Education',
                    stageName: 'Incoming Stage',
                },
            },
        },
    }),
});

test('duplicating an article to a pre-configured desk and stage', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        'Edit',
    );

    await page.locator(s('authoring', 'field-slugline')).fill('story 2.1');

    await page.locator(s('authoring-topbar'))
        .getByRole('button', {name: 'Send and duplicate'})
        .click();

    await page.locator(s('unsaved-changes-dialog')).getByRole('button', {name: 'Save'}).click();

    await expect(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2.1')),
    ).toBeVisible();

    await monitoring.selectDeskOrWorkspace('Education');

    await expect(
        page.locator(s('monitoring-group=Education / Incoming Stage', 'article-item=story 2.1')),
    ).toBeVisible();
});
