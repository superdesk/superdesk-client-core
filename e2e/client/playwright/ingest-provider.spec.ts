import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

const PROVIDER_NAME = 'Antara news provider';

test.describe('ingest provider', () => {
    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/ingest_dashboard');
    });

    async function addProviderToDashboard(page: Page) {
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

    test('add ingest provider to dashboard', async ({page}) => {
        await addProviderToDashboard(page);
    });

    test('remove ingest provider from dashboard', async ({page}) => {
        await addProviderToDashboard(page);

        // Reload to reset the dashboard dropdown state. The previous toggle
        // click inside addProviderToDashboard auto-closes the menu, which
        // races with the next open/click sequence below.
        await page.goto('/#/ingest_dashboard');

        await expect(
            page.locator(s('ingest-dashboard-list', `ingest-dashboard-widget=${PROVIDER_NAME}`)),
        ).toBeVisible();

        // The dropdown's <ul> is rendered into the DOM only when the parent
        // <div data-test-id="ingest-dashboard-add-sources" class="dropdown"> has the
        // `.open` class. The Add Sources toggle is the only child button, but
        // its first click sometimes lands before AngularJS's `dropdown` directive
        // wires up the click handler. Retry until the dropdown opens.
        const dropdownContainer = page.locator(s('ingest-dashboard-add-sources'));

        await expect.poll(async () => {
            if (!(await dropdownContainer.evaluate((el) => el.classList.contains('open')))) {
                await page.locator(s('ingest-dashboard-add-sources--toggle')).click();
            }

            return dropdownContainer.evaluate((el) => el.classList.contains('open'));
        }, {timeout: 10000}).toBe(true);

        const providerToggle = page.locator(
            s('ingest-dashboard-add-sources', `ingest-source-option=${PROVIDER_NAME}`, 'ingest-source-option--toggle'),
        );

        await expect(providerToggle).toBeVisible();
        await expect(providerToggle).toHaveClass(/checked/);
        await providerToggle.click();
        await expect(providerToggle).not.toHaveClass(/checked/);

        await expect(page.locator(s('ingest-dashboard-list', 'ingest-dashboard-widget'))).toHaveCount(0);
    });

    test('change settings for ingest provider widget', {
        annotation: [
            {type: 'confluence', description: '1308524883 complete'}, // Ingest Widget Settings
        ],
    }, async ({page}) => {
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

    test('open edit source dialog from ingest settings', {
        annotation: [
            {type: 'confluence', description: '1311834976 complete'}, // Add source
            {type: 'confluence', description: '1311834949 complete'}, // Add ingest source
            {type: 'confluence', description: '1311834951 complete'}, // Edit ingest source
        ],
    }, async ({page}) => {
        await addProviderToDashboard(page);

        const widget = page.locator(s('ingest-dashboard-list', `ingest-dashboard-widget=${PROVIDER_NAME}`));

        await widget.locator(s('ingest-dashboard-widget--settings-toggle')).click();
        await widget.locator(s('ingest-dashboard-widget--edit-source')).click();

        await expect(page.locator(s('ingest-settings'))).toBeVisible();

        await page.locator(s('ingest-sources-status-filter')).click();
        await page.locator(s('ingest-sources-status-filter--option=Closed')).click();

        const providerRow = page.locator(s(`ingest-source=${PROVIDER_NAME}`));

        await expect(providerRow).toBeVisible();
        await providerRow.hover();
        await providerRow.locator(s('ingest-source--edit')).click();

        await expect(
            page.locator(s('ingest-source-modal', 'ingest-source-modal--field--name')),
        ).toBeVisible();
    });
});
