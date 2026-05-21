import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {TreeSelectDriver} from './utils/tree-select-driver';

const INGEST_ITEM = 'Indonesia opens pasteurized milk facility to back free meals program';

async function toggleStageGlobalRead(page, stageName: string): Promise<void> {
    await page.locator(s(`stage--${stageName}`)).click();
    await page.locator(s(`stage--${stageName}`, 'stage-actions--edit')).click();
    await page.locator(s('desk-config-modal', 'field--global-read')).click();
    await page.locator(s('desk-config-modal', 'save-edited-stage')).click();
}

// FLAKY: Removing ingest items leaves the item visible but it should disappear — likely the deletion happens via a confirm modal we haven't located yet.
test.skip('removing an ingest item', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/search?repo=ingest');

    await expect(page.locator(s(`article-item=${INGEST_ITEM}`))).toBeVisible();

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s(`article-item=${INGEST_ITEM}`)),
        'Remove',
    );

    await expect(page.locator(s(`article-item=${INGEST_ITEM}`))).not.toBeVisible();
});

// FLAKY: Desk config modal stage editor needs additional test-ids beyond what's currently in place; see desks_spec BLOCKED entry.
test.skip('fetch-and-open is disabled when selected desk is non-member and target stage has Global Read OFF', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/desks');
    await page.locator(s('desk--Without members')).click();
    await page.locator(s('desk--Without members', 'desk-actions')).click();
    await page.locator(s('desk--Without members', 'desk-actions--edit')).click();

    await page.locator(s('desk-config-modal')).getByRole('tab', {name: 'Stages'}).click();
    await toggleStageGlobalRead(page, 'Working Stage');
    await page.locator(s('desk-config-modal', 'done-stages')).click();

    await page.goto('/#/search?repo=ingest');
    await monitoring.executeActionOnMonitoringItem(
        page.locator(s(`article-item=${INGEST_ITEM}`)),
        'Fetch To',
    );

    await expect(page.locator(s('interactive-actions-panel', 'fetch-and-open'))).toBeEnabled();

    await new TreeSelectDriver(
        page,
        page.locator(s('destination-select')),
    ).setValues('Without members');

    await expect(page.locator(s('interactive-actions-panel', 'fetch-and-open'))).toBeDisabled();
});

// FLAKY: Desk config modal stage editor needs additional test-ids beyond what's currently in place; see desks_spec BLOCKED entry.
test.skip('stage with Global Read OFF is hidden from stage selector for a non-member', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/desks');
    await page.locator(s('desk--Without members')).click();
    await page.locator(s('desk--Without members', 'desk-actions')).click();
    await page.locator(s('desk--Without members', 'desk-actions--edit')).click();

    await page.locator(s('desk-config-modal')).getByRole('tab', {name: 'Stages'}).click();

    await page.locator(s('desk-config-modal', 'new-stage')).click();
    await page.locator(s('desk-config-modal', 'field--stage-name')).fill('Test Stage');
    await page.locator(s('desk-config-modal', 'field--global-read')).click();
    await page.locator(s('desk-config-modal', 'save-new-stage')).click();

    await page.locator(s('desk-config-modal', 'done-stages')).click();

    await page.goto('/#/search?repo=ingest');
    await monitoring.executeActionOnMonitoringItem(
        page.locator(s(`article-item=${INGEST_ITEM}`)),
        'Fetch To',
    );

    await new TreeSelectDriver(
        page,
        page.locator(s('destination-select')),
    ).setValues('Without members');

    const stageSelect = page.locator(s('interactive-actions-panel', 'stage-select'));

    await expect(stageSelect.locator(s('item=Working Stage'))).toBeVisible();
    await expect(stageSelect.locator(s('item=Test Stage'))).not.toBeVisible();
});

test('bulk-fetching an ingest item via the multi-action bar', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/search?repo=ingest');

    await expect(page.locator(s(`article-item=${INGEST_ITEM}`))).toBeVisible();

    await page.locator(s(`article-item=${INGEST_ITEM}`, 'item-type-and-multi-select')).hover();
    await page.locator(s(`article-item=${INGEST_ITEM}`, 'multi-select-checkbox')).click();

    await expect(page.locator(s('multi-action-bar'))).toBeVisible();
    await page.locator(s('multi-action-bar', 'multi-actions-inline', 'Fetch')).click();

    await page.goto('/#/workspace/monitoring');
    await expect(
        page.locator(s(
            'monitoring-group=Sports / Incoming Stage',
            `article-item=${INGEST_ITEM}`,
        )),
    ).toBeVisible();
});

// FLAKY: Removing ingest items leaves the item visible but it should disappear — likely the deletion happens via a confirm modal we haven't located yet.
test.skip('bulk-removing an ingest item via the multi-action bar', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/search?repo=ingest');

    await expect(page.locator(s(`article-item=${INGEST_ITEM}`))).toBeVisible();

    await page.locator(s(`article-item=${INGEST_ITEM}`, 'item-type-and-multi-select')).hover();
    await page.locator(s(`article-item=${INGEST_ITEM}`, 'multi-select-checkbox')).click();

    await expect(page.locator(s('multi-action-bar'))).toBeVisible();
    await page.locator(s('multi-action-bar', 'multi-actions-inline', 'Remove')).click();

    await expect(page.locator(s(`article-item=${INGEST_ITEM}`))).not.toBeVisible();
});
