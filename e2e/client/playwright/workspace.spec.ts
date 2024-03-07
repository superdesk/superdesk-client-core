import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('Custom Workspace', async () => {
    test.describe('Create custom workspace', async () => {
        test('save custom workspace', async ({page}) => {
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

        test('cancel creating custom workspace', async ({page}) => {
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
    });

    test.describe('Create article in custom workspace', async () => {
        test('Create article in custom workspace', async ({page}) => {
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

        test('cancel and ignore button from unsaved changes modal', async ({page}) => {
            const monitoring = new Monitoring(page);

            await restoreDatabaseSnapshot();
            await page.goto('/#/workspace/monitoring');

            await monitoring.selectDeskOrWorkspace('Workspace 1');

            // create article without saving
            await monitoring.createArticleFromTemplate('story', 'new article');

            // check unsaved changes modal is visible
            await page.locator(s('authoring-topbar', 'close')).click();
            await expect(page.locator(s('options-modal')).getByRole('dialog')).toBeVisible();

            // button - cancel
            await page.locator(s('options-modal')).getByRole('button', {name: 'cancel'}).click();
            await expect(page.locator(s('authoring'))).toBeVisible();

            // button - ignore
            await page.locator(s('authoring-topbar', 'close')).click();
            await page.locator(s('options-modal')).getByRole('button', {name: 'ignore'}).click();
            await expect(page.locator(s('authoring'))).not.toBeVisible();
            await expect(page.locator(s('monitoring-view', 'article-item=new article'))).not.toBeVisible();
        });

        test('save button from unsaved changes modal', async ({page}) => {
            const monitoring = new Monitoring(page);

            await restoreDatabaseSnapshot();
            await page.goto('/#/workspace/monitoring');

            await monitoring.selectDeskOrWorkspace('Workspace 1');

            // create article without saving
            await monitoring.createArticleFromTemplate('story', 'new article');

            // button - save
            await page.locator(s('authoring-topbar', 'close')).click();
            await page.locator(s('options-modal')).getByRole('button', {name: 'save'}).click();
            await expect(page.locator(s('authoring'))).not.toBeVisible();
            await expect(page.locator(s('monitoring-view', 'article-item=new article'))).toBeVisible();
        });
    });

    test('Add widget to custom workspace dashboard', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace');

        await monitoring.selectDeskOrWorkspace('Workspace 1');

        await expect(
            page.locator(s('widget-grid', 'widget=world-clock')),
        ).not.toBeVisible();

        await page.getByRole('button', {name: 'Add widget'}).click();
        await page.locator(s('widget-modal', 'widget-item=world-clock')).click();
        await page.locator(s('widget-modal')).getByRole('button', {name: 'Add This Widget'}).click();
        await page.locator(s('widget-modal')).getByRole('button', {name: 'Done'}).click();
        await expect(
            page.locator(s('widget-grid', 'widget=world-clock')),
        ).toBeVisible();
    });

    test('Spike and unspike article from custom workspace', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        await monitoring.selectDeskOrWorkspace('Workspace 1');

        // spike article
        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=story 2')),
            'Spike Item',
        );
        await page.locator(s('spike-modal')).getByRole('button', {name: 'spike'}).click();

        // check is article removed form monitoring
        await expect(page.locator(s('monitoring-view', 'article-item=story 2'))).not.toBeVisible();

        // go to spike item list and check visibility of article
        await page.locator(s('Spiked Items')).click();
        await expect(page.locator(s('articles-list', 'article-item=story 2'))).toBeVisible();

        // unspike article
        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=story 2')),
            'Unspike Item',
        );
        await expect(page.locator(s('interactive-actions-panel'))).toBeVisible();
        await page.locator(s('interactive-actions-panel')).locator(s('item'), {hasText: 'Working Stage'}).check();
        await page.locator(s('interactive-actions-panel', 'unspike')).click();

        // go to monitoring and check visibility of article
        await page.goto('/#/workspace/monitoring');
        await expect(page.locator(s('monitoring-view', 'article-item=story 2'))).toBeVisible();
    });
});
