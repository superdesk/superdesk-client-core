import {test, expect, Page} from '@playwright/test';
import {login, restoreDatabaseSnapshot, s} from './utils';

// The Protractor ingest_settings_spec ran against the 'legacy' snapshot
// (resetApp(..., {name: 'legacy'}) in fixtures.ts). The Playwright suite
// defaults to 'main', whose storageState targets the 'main' user database;
// reset storageState and log in fresh, matching archived.spec.ts.
test.use({storageState: {cookies: [], origins: []}});

async function openRoutingTab(page: Page): Promise<void> {
    await page.goto('/#/settings/ingest');
    await page.getByRole('button', {name: 'Ingest Routing'}).click();
}

async function startNewSchemeWithFetchPublishRule(page: Page, schemeName: string): Promise<void> {
    await page.getByRole('button', {name: /Add New/}).click();
    await page.locator('[placeholder="Scheme name"]').fill(schemeName);
    await page.locator(s('add-routing-rule-button')).click();
    await page.locator(s('rule-handler--desk_fetch_publish')).click();
}

test.describe('ingest_settings', () => {
    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'legacy'});
        await login(page);
        await openRoutingTab(page);
    });

    test('contains the Schedule tab for editing routing schedules', async ({page}) => {
        await startNewSchemeWithFetchPublishRule(page, 'My Routing Scheme');

        await page.locator('[placeholder="Rule name"]').fill('Routing Rule 1');

        const daysBox = page.locator('.day-filter-box');

        await daysBox.locator('.sd-checkbox--button-Saturday').click();
        await daysBox.locator('.sd-checkbox--button-Sunday').click();

        await page.locator('.sd-checkbox--button-allDay').click();

        // The timezone widget shows a typeahead when no timezone is set, and
        // a pill with id="timezone" + clear button when one is set. New rules
        // default to a populated timezone (e.g. Europe/London), so we clear
        // it before searching for a new one.
        const tzPill = page.locator('.pills-list', {has: page.locator('#timezone')});

        if (await tzPill.isVisible()) {
            // .actions only display on hover (display: none otherwise)
            await tzPill.locator('li').first().hover();
            await page.locator('[ng-click="clearSelectedTimeZone()"]').click();
        }

        const tzInput = page.locator('[term="tzSearchTerm"]').locator('input');

        await expect(tzInput).toBeVisible();
        await tzInput.fill('Asia/Singapore');

        const tzOption = page.locator('.item-list li').filter({hasText: 'Asia/Singapore'}).first();

        await expect(tzOption).toBeVisible();
        await tzOption.click();

        await page.getByRole('button', {name: 'Save', exact: true}).click();

        await expect(
            page.locator(s('notification--success=Routing scheme saved.')),
        ).toBeVisible();
    });

    test('cannot save a routing scheme with blank rule', async ({page}) => {
        await startNewSchemeWithFetchPublishRule(page, 'Test Scheme');

        const ruleNameInput = page.locator('[placeholder="Rule name"]');
        const saveButton = page.getByRole('button', {name: 'Save', exact: true});

        await expect(ruleNameInput).toHaveValue('');
        await expect(saveButton).toBeDisabled();

        await ruleNameInput.fill('Test Rule');
        await expect(ruleNameInput).toHaveValue('Test Rule');
        await expect(saveButton).toBeEnabled();
    });
});
