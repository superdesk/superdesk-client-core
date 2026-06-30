import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test('print preview renders the document without crashing (authoring-react)', async ({page}) => {
    await restoreDatabaseSnapshot();
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
        'Edit',
    );

    await authoring.waitForAuthoringReactToInitialize();

    await page.getByRole('button', {name: 'Print preview'}).click();

    // The preview iterates every profile field and renders its previewComponent.
    // A render crash (e.g. an unguarded field preview) would leave this empty.
    const preview = page.locator(s('print-preview'));

    await expect(preview).toBeVisible();
    await expect(preview.getByText('test sports story').first()).toBeVisible();
});
