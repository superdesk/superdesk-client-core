import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('creating a custom workspace', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await page.locator(s('monitoring--selected-desk')).click();
    await page.locator(s('monitoring--select-desk-options')).getByRole('button', {name: 'create new workspace'}).click();
    await expect(page.locator(s('workspace-modal')).locator('button', {hasText: 'save'})).toBeDisabled();
    await page.locator(s('workspace-modal')).getByLabel('workspace name').fill('new custom workspace');
    await expect(page.locator(s('workspace-modal')).locator('button', {hasText: 'save'})).toBeEnabled();
    await page.locator(s('workspace-modal')).locator('button', {hasText: 'save'}).click();
    await expect(page.locator(s('monitoring--selected-desk'), {hasText: 'new custom workspace'})).toBeVisible();
});

test('cancelling creation of a custom workspace', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await page.locator(s('monitoring--selected-desk')).click();
    await page.locator(s('monitoring--select-desk-options')).getByRole('button', {name: 'create new workspace'}).click();
    await page.locator(s('workspace-modal')).getByLabel('workspace name').fill('new custom workspace');
    await expect(page.locator(s('workspace-modal')).locator('button', {hasText: 'cancel'})).toBeEnabled();
    await page.locator(s('workspace-modal')).locator('button', {hasText: 'cancel'}).click();
    await expect(
        page.locator(s('monitoring--selected-desk'), {hasText: 'new custom workspace'}),
    ).not.toBeVisible();
});

test('creating an article from a custom workspace', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Workspace 1');

    // create new article and save it
    await monitoring.createArticleFromTemplate('story', 'new article 2');
    await page.locator(s('authoring-topbar', 'save')).click();

    // check if article exist in monitoring group
    await expect(page.locator(s('monitoring-view', 'article-item=new article 2'))).toBeVisible();
});