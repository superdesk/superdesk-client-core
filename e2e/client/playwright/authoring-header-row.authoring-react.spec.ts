import {test, expect, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

/**
 * Opens an item from the Sports working stage by its exact monitoring label. The label is matched on
 * `data-test-value` rather than with `hasText`, because the fixture deliberately contains items whose
 * labels are prefixes of one another ("Story 3" / "Story 3 sibling").
 */
async function openFromSportsWorkingStage(page: Page, label: string): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page
            .getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'))
            .getByTestId('article-item')
            .and(page.locator(`[data-test-value="${label}"]`)),
        'Edit',
    );

    // Every fixture item has a source, so the source block is a reliable "header has rendered"
    // signal to settle on before asserting that other blocks are present or absent.
    await expect(page.getByTestId('authoring-header-source')).toBeVisible();
}

/**
 * Same as above for the Finance working stage. The broadcast fixture is parked there so it cannot
 * push the Sports group past its 10 item cap and hide the items the other tests open.
 */
async function openFromFinanceWorkingStage(page: Page, label: string): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Finance');

    await monitoring.executeActionOnMonitoringItem(
        page
            .getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Finance / Working Stage"]'))
            .getByTestId('article-item')
            .and(page.locator(`[data-test-value="${label}"]`)),
        'Edit',
    );

    await expect(page.getByTestId('authoring-header-source')).toBeVisible();
}

test.describe('authoring-react header row', () => {
    test('shows every signal of the item, by name or by qcode', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromSportsWorkingStage(page, 'test sports story');

        const signal = page.getByTestId('authoring-header-signal');

        await expect(signal).toBeVisible();
        await expect(signal).toContainText('Correction warning');
        await expect(signal).toContainText('rpt');
    });

    test('shows the correction sequence as the UPDATE value', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromSportsWorkingStage(page, 'test sports story');

        await expect(page.getByTestId('authoring-header-correction-sequence'))
            .toHaveAttribute('data-test-value', '3');
    });

    test('shows no signal or UPDATE block for an item that has neither', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromSportsWorkingStage(page, 'Story 3');

        await expect(page.getByTestId('authoring-header-signal')).toHaveCount(0);
        await expect(page.getByTestId('authoring-header-correction-sequence')).toHaveCount(0);
    });

    test('shows the legal, sms, not-for-publication and updated state labels', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromSportsWorkingStage(page, 'story 2');

        const labels = page.getByTestId('authoring-header-state-labels');

        await expect(labels.getByTestId('authoring-header-legal')).toBeVisible();
        await expect(labels.getByTestId('authoring-header-sms')).toBeVisible();
        await expect(labels.getByTestId('authoring-header-not-for-publication')).toBeVisible();
        await expect(labels.getByTestId('authoring-header-updated')).toBeVisible();
    });

    test('shows Missing Link when a same-slugline item was created since midnight', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromSportsWorkingStage(page, 'Story 3');

        await expect(page.getByTestId('authoring-header-missing-link')).toBeVisible();
    });

    test('shows no Missing Link for an item that is already part of a rewrite chain', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});

        // "Story 3 rewrite" shares its slugline with the future-dated sibling, so the related items
        // half of the legacy condition is satisfied and `rewrite_of` is the only thing suppressing
        // the label. Using an item without a sibling would pass for the wrong reason.
        await openFromSportsWorkingStage(page, 'Story 3 rewrite');

        await expect(page.getByTestId('authoring-header-missing-link')).toHaveCount(0);
    });

    test('shows no state label row for an item with no flags and no rewrite', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromSportsWorkingStage(page, 'Header translations original');

        await expect(page.getByTestId('authoring-header-state-labels')).toHaveCount(0);
    });

    test('shows the MASTER label with its status marker on a broadcast item', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromFinanceWorkingStage(page, 'Broadcast of Story 5');

        const master = page.getByTestId('authoring-header-broadcast-master');

        await expect(master).toBeVisible();
        await expect(master).toContainText('MASTER');
        await expect(page.getByTestId('authoring-header-broadcast-label')).toHaveAttribute('title', 'Correction');
        await expect(page.getByTestId('authoring-header-broadcast-status')).toBeVisible();
    });

    test('shows no MASTER label on an item that is not a broadcast', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromSportsWorkingStage(page, 'Story 3');

        await expect(page.getByTestId('authoring-header-broadcast-master')).toHaveCount(0);
    });

    test('previews the master story in the monitoring list from the MASTER link', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        const monitoring = new Monitoring(page);

        await openFromFinanceWorkingStage(page, 'Broadcast of Story 5');

        await expect(monitoring.getPreviewPane()).toHaveCount(0);

        await page.getByTestId('authoring-header-preview-master').click();

        // The link fires `broadcast:preview`, which the monitoring list handles by opening its
        // preview pane on the master story rather than anything inside authoring.
        const previewHeadline = monitoring.getPreviewPane().getByTestId('field--headline');

        await expect(previewHeadline).toContainText('Story 5');

        // The broadcast item's own headline is "Broadcast of Story 5", which also contains
        // "Story 5", so asserting its absence is what makes this catch previewing the wrong item.
        await expect(previewHeadline).not.toContainText('Broadcast');
    });

    test('shows the Original pill and the translation count on the source item', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromSportsWorkingStage(page, 'Header translations original');

        await expect(page.getByTestId('authoring-header-original')).toBeVisible();
        await expect(page.getByTestId('authoring-header-translations-count'))
            .toHaveAttribute('data-test-value', '1');
    });

    test('shows the language it was translated from on a translated item', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromSportsWorkingStage(page, 'Header translations german');

        await expect(page.getByTestId('authoring-header-translated-from'))
            .toHaveAttribute('data-test-value', 'en');
        await expect(page.getByTestId('authoring-header-original')).toHaveCount(0);
    });

    test('opens the translations side widget from the translation count link', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromSportsWorkingStage(page, 'Header translations original');

        await expect(page.getByTestId('translations-widget')).toHaveCount(0);

        await page.getByTestId('authoring-header-translations-count').click();

        await expect(page.getByTestId('translations-widget')).toContainText('Header translations german');
    });

    test('shows no translations block for an item outside a translation chain', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromSportsWorkingStage(page, 'Story 3');

        await expect(page.getByTestId('authoring-header-translations')).toHaveCount(0);
    });
});
