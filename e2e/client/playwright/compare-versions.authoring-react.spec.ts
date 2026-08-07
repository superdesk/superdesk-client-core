import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test('compare versions renders dateline and custom field differences (authoring-react)', {
    annotation: [
        {type: 'confluence', description: '1308524931 partial'}, // Compare versions (AUTOMATED)
    ],
}, async ({page}) => {
    // `compare-fields` clones the default snapshot and adds urls/boolean/dropdown custom fields plus
    // a populated dateline on the Story profile, with two versions carrying differing values.
    await restoreDatabaseSnapshot({snapshotName: 'compare-fields'});
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
        'Edit',
    );

    await authoring.waitForAuthoringReactToInitialize();

    await page.getByRole('button', {name: 'Actions menu'}).click();
    await page.getByText('Compare versions', {exact: true}).click();

    const difference = page.locator(s('compare-versions-difference'));

    await expect(difference).toBeVisible();

    // dateline previously rendered its raw object value as a React child, which throws. Assert both
    // versions' composed dateline text renders, and that no field leaked "[object Object]".
    await expect(difference).toContainText('BERLIN, June 15 AP -');
    await expect(difference).toContainText('PARIS, March 1 AP -');
    await expect(difference).not.toContainText('object Object');

    // boolean had no difference component, so it fell back to the "not implemented" alert. It now
    // diffs as Yes/No. The compared versions flip sample_boolean true -> false, so both labels show.
    const booleanDifference = page.locator(s('compare-versions-difference', 'compare-field=sample_boolean'));

    await expect(booleanDifference).toContainText('Yes');
    await expect(booleanDifference).toContainText('No');
    await expect(booleanDifference).not.toContainText('is not implemented');
});
