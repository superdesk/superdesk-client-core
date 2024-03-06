import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('Custom Workspace', async () => {
    test.describe('Create custom workspace', async () => {
        test('save custom workspace', async ({page}) => {
            await restoreDatabaseSnapshot();
            await page.goto('/#/workspace/monitoring');

            await page.locator(s('monitoring--selected-desk')).click();
            await page.locator(s('create-workspace')).click();
            await expect(page.locator(s('workspace-modal', 'workspace-name'))).toBeVisible();
            await expect(page.locator('button', {hasText: 'save'})).toBeDisabled();
            await page.locator(s('workspace-modal')).locator(s('workspace-name')).fill('new custom workspace');
            await expect(page.locator('button', {hasText: 'save'})).toBeEnabled();
            await page.locator('button', {hasText: 'save'}).click();
            await expect(page.locator(s('monitoring--selected-desk'), {hasText: 'new custom workspace'})).toBeVisible();
        });

        test('cancel creating custom workspace', async ({page}) => {
            await restoreDatabaseSnapshot();
            await page.goto('/#/workspace/monitoring');

            await page.locator(s('monitoring--selected-desk')).click();
            await page.locator(s('create-workspace')).click();
            await expect(page.locator(s('workspace-modal', 'workspace-name'))).toBeVisible();
            await expect(page.locator('button', {hasText: 'save'})).toBeDisabled();
            await page.locator(s('workspace-modal')).locator(s('workspace-name')).fill('new custom workspace');
            await expect(page.locator('button', {hasText: 'cancel'})).toBeEnabled();
            await page.locator('button', {hasText: 'cancel'}).click();
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
            await monitoring.createArticleFromTemplate('new article 2');
            await page.locator(s('authoring-topbar')).locator(s('save')).click();

            // check if authoring still open and if button save disabled
            await expect(page.locator(s('authoring')).locator(s('field-slugline'))).toHaveValue('new article 2');
            await expect(page.locator(s('authoring-topbar')).locator(s('save'))).toBeDisabled();
            await expect(page.locator(s('monitoring-view')).locator(s('article-item=new article 2'))).toBeVisible();

            // close authoring
            await page.locator(s('authoring-topbar')).locator(s('close')).click();
            await expect(page.locator(s('authoring'))).not.toBeVisible();
        });

        test('cancel and ignore button from unsaved changes modal', async ({page}) => {
            const monitoring = new Monitoring(page);

            await restoreDatabaseSnapshot();
            await page.goto('/#/workspace/monitoring');

            await monitoring.selectDeskOrWorkspace('Workspace 1');

            // create article without saving
            await monitoring.createArticleFromTemplate('new article');

            // check unsaved changes modal is visible
            await page.locator(s('authoring-topbar')).locator(s('close')).click();
            await expect(page.locator(s('options-modal')).getByRole('dialog')).toBeVisible();

            // button - cancel
            await page.locator(s('options-modal')).getByRole('button', {name: 'cancel'}).click();
            await expect(page.locator(s('authoring'))).toBeVisible();

            // button - ignore
            await page.locator(s('authoring-topbar')).locator(s('close')).click();
            await page.locator(s('options-modal')).getByRole('button', {name: 'ignore'}).click();
            await expect(page.locator(s('authoring'))).not.toBeVisible();
            await expect(page.locator(s('monitoring-view')).locator(s('article-item=new article'))).not.toBeVisible();
        });

        test('save button from unsaved changes modal', async ({page}) => {
            const monitoring = new Monitoring(page);

            await restoreDatabaseSnapshot();
            await page.goto('/#/workspace/monitoring');

            await monitoring.selectDeskOrWorkspace('Workspace 1');

            // create article without saving
            await monitoring.createArticleFromTemplate('new article');

            // button - save
            await page.locator(s('authoring-topbar')).locator(s('close')).click();
            await page.locator(s('options-modal')).getByRole('button', {name: 'save'}).click();
            await expect(page.locator(s('authoring'))).not.toBeVisible();
            await expect(page.locator(s('monitoring-view')).locator(s('article-item=new article'))).toBeVisible();
        });
    });

    test('Add widget to custom workspace dashboard', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace');

        await monitoring.selectDeskOrWorkspace('Workspace 1');

        await page.getByRole('button', {name: 'Add widget'}).click();
        await page.locator(s('widget-modal', 'widget-item=world-clock')).click();
        await page.locator(s('widget-modal')).getByRole('button', {name: 'Add This Widget'}).click();
        await page.locator(s('widget-modal')).getByRole('button', {name: 'Done'}).click();
        await expect(
            page.locator(s('dashboard')).locator(s('widget-grid')).locator('li', {hasText: 'World Clock'}),
        ).toBeVisible();
    });

    test('Spike and unspike article from custom workspace', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        await monitoring.selectDeskOrWorkspace('Workspace 1');

        // spike article
        await page.hover(s('article-item=story 2'));
        await page.locator(s('monitoring-view', 'article-item=story 2', 'context-menu-button')).click();
        await page.locator(s('context-menu')).locator('button', {hasText: 'Spike Item'}).click();
        await page.locator(s('spike-modal')).getByRole('button', {name: 'spike'}).click();

        // check is article removed form monitoring
        await expect(page.locator(s('monitoring-view')).locator(s('article-item=story 2'))).not.toBeVisible();

        // go to spike item list and check visibility of article
        await page.locator(s('Spiked Items')).click();
        await expect(page.locator(s('articles-list')).locator(s('article-item=story 2'))).toBeVisible();

        // unspike article
        await page.hover(s('article-item=story 2'));
        await page.locator(s('monitoring-view', 'article-item=story 2', 'context-menu-button')).click();
        await page.locator(s('context-menu')).locator('button', {hasText: 'Unspike Item'}).click();
        await expect(page.locator(s('interactive-actions-panel'))).toBeVisible();
        await page.locator(s('interactive-actions-panel')).locator(s('item'), {hasText: 'Working Stage'}).check();
        await page.locator(s('interactive-actions-panel')).locator(s('unspike')).click();

        // go to monitoring and check visibility of article
        await page.goto('/#/workspace/monitoring');
        await expect(page.locator(s('monitoring-view')).locator(s('article-item=story 2'))).toBeVisible();
    });
});
