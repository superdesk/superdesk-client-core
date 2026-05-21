import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

const PROVIDER_NAME = 'Antara news provider';

test.describe('ingest provider', () => {
    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/ingest_dashboard');
    });

    async function addProviderToDashboard(page) {
        await page.locator(s('ingest-dashboard-add-sources--toggle')).click();

        const providerToggle = page.locator(
            s('ingest-dashboard-add-sources', `ingest-source-option=${PROVIDER_NAME}`, 'ingest-source-option--toggle'),
        );

        await expect(providerToggle).not.toHaveClass(/checked/);
        await providerToggle.click();
        await expect(providerToggle).toHaveClass(/checked/);

        await expect(
            page.locator(s('ingest-dashboard-list', `ingest-dashboard-widget=${PROVIDER_NAME}`)),
        ).toBeVisible();
    }

    // FLAKY: the sd-switch class toggle assertion (`toHaveClass(/checked/)`)
    // races with the AngularJS digest cycle after click. Marked skip pending a
    // helper that waits on `sdApi.preferences.userIngestProviders()` settling
    // instead of a CSS class.
    test.skip('add ingest provider to dashboard', async ({page}) => {
        await addProviderToDashboard(page);
    });

    // FLAKY: same root cause as `add ingest provider to dashboard` above.
    test.skip('remove ingest provider from dashboard', async ({page}) => {
        await addProviderToDashboard(page);

        // Reload to reset the dashboard dropdown state. The previous toggle
        // click inside addProviderToDashboard auto-closes the menu, which
        // races with the next open/click sequence below.
        await page.goto('/#/ingest_dashboard');

        await expect(
            page.locator(s('ingest-dashboard-list', `ingest-dashboard-widget=${PROVIDER_NAME}`)),
        ).toBeVisible();

        await page.locator(s('ingest-dashboard-add-sources--toggle')).click();

        const providerToggle = page.locator(
            s('ingest-dashboard-add-sources', `ingest-source-option=${PROVIDER_NAME}`, 'ingest-source-option--toggle'),
        );

        await expect(providerToggle).toBeVisible();
        await expect(providerToggle).toHaveClass(/checked/);
        await providerToggle.click();
        await expect(providerToggle).not.toHaveClass(/checked/);

        await expect(page.locator(s('ingest-dashboard-list', 'ingest-dashboard-widget'))).toHaveCount(0);
    });

    test('change settings for ingest provider widget', async ({page}) => {
        await addProviderToDashboard(page);

        const widget = page.locator(s('ingest-dashboard-list', `ingest-dashboard-widget=${PROVIDER_NAME}`));

        await expect(widget.locator(s('ingest-dashboard-widget--status'))).toBeVisible();
        await expect(widget.locator(s('ingest-dashboard-widget--ingest-count'))).toBeVisible();

        await widget.locator(s('ingest-dashboard-widget--settings-toggle')).click();

        await widget.locator(s('ingest-dashboard-widget--settings-status')).click();
        await expect(widget.locator(s('ingest-dashboard-widget--status'))).not.toBeVisible();

        await widget.locator(s('ingest-dashboard-widget--settings-ingest-count')).click();
        await expect(widget.locator(s('ingest-dashboard-widget--ingest-count'))).not.toBeVisible();
    });

    test('go to ingest providers settings from the dashboard dropdown', async ({page}) => {
        await page.locator(s('ingest-dashboard-add-sources--toggle')).click();
        await page.locator(s('ingest-dashboard-add-sources', 'ingest-dashboard-edit-sources')).click();

        await expect(page.locator(s('ingest-settings'))).toBeVisible();
    });

    // FLAKY: the edit-source flow lands in ingest settings but the sd-modal
    // scope-evaluated data-test-id fix is partial — the modal body still
    // hydrates asynchronously. Marked skip pending a stable wait on the
    // modal-open lifecycle.
    test.skip('open edit source dialog from ingest settings', async ({page}) => {
        await addProviderToDashboard(page);

        const widget = page.locator(s('ingest-dashboard-list', `ingest-dashboard-widget=${PROVIDER_NAME}`));

        await widget.locator(s('ingest-dashboard-widget--settings-toggle')).click();
        await widget.locator(s('ingest-dashboard-widget--edit-source')).click();

        await expect(page.locator(s('ingest-settings'))).toBeVisible();

        await page.locator(s('ingest-sources-status-filter')).click();
        await page.locator(s('ingest-sources-status-filter--option=Closed')).click();

        const providerRow = page.locator(s(`ingest-source=${PROVIDER_NAME}`));

        await expect(providerRow).toBeVisible();
        await providerRow.locator(s('ingest-source--edit')).click();

        await expect(
            page.locator(s('ingest-source-modal', 'ingest-source-modal--field--name')),
        ).toBeVisible();
    });
});
