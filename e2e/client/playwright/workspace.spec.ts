import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('Custom Workspace', async () => {
    test('Create custom workspace', async ({page}) => {
        const customWorkSpace = async (buttonText) => {
            await page.locator(s('monitoring--selected-desk')).click();
            await page.locator(s('create-workspace')).click();
            await expect(page.locator(s('workspace-modal')).locator(s('workspace-name'))).toBeVisible();
            await expect(page.locator('button', {hasText: 'save'})).toBeDisabled();
            await page.locator(s('workspace-modal')).locator(s('workspace-name')).fill('new custom workspace');
            await expect(page.locator('button', {hasText: buttonText})).toBeEnabled();
            await page.locator('button', {hasText: buttonText}).click();
        };

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        // cancel creating custom workspace
        await customWorkSpace('cancel');
        await expect(page.locator(s('monitoring--selected-desk'), {hasText: 'new custom workspace'})).not.toBeVisible();

        // save custom workspace
        await customWorkSpace('save');
        await expect(page.locator(s('monitoring--selected-desk'), {hasText: 'new custom workspace'})).toBeVisible();
    });

    test('Create article in custom workspace', async ({page}) => {
        test.setTimeout(60000);

        const monitoring = new Monitoring(page);

        const articleTemplateSlugline = async (slugline) => {
            await page.locator(s('create-new-item')).click();
            await page.locator(s('default-desk-template')).click();
            await page.locator(s('authoring', 'field-slugline')).fill(slugline);
        };

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        await page.goto('/#/workspace/monitoring');

        await monitoring.selectDeskOrWorkspace('Workspace 1');

        // starting create item
        await articleTemplateSlugline('new article');

        // check unsaved changes modal is visible
        await page.locator(s('authoring-topbar')).locator(s('close')).click();
        await expect(page.locator(s('options-modal')).getByRole('dialog')).toBeVisible();

        // modal button - cancel
        await page.locator(s('options-modal')).getByRole('button', {name: 'cancel'}).click();
        await expect(page.locator(s('authoring'))).toBeVisible();

        // modal button - ignore
        await page.locator(s('authoring-topbar')).locator(s('close')).click();
        await page.locator(s('options-modal')).getByRole('button', {name: 'ignore'}).click();
        await expect(page.locator(s('authoring'))).not.toBeVisible();
        await expect(page.locator(s('monitoring-view')).locator(s('article-item=new article'))).not.toBeVisible();

        //  modal button - save
        await articleTemplateSlugline('new article');
        await page.locator(s('authoring-topbar')).locator(s('close')).click();
        await page.locator(s('options-modal')).getByRole('button', {name: 'save'}).click();
        await expect(page.locator(s('authoring'))).not.toBeVisible();
        await expect(page.locator(s('monitoring-view')).locator(s('article-item=new article'))).toBeVisible();

        // create new one and save
        await articleTemplateSlugline('new article 2');
        await page.locator(s('authoring-topbar')).locator(s('save')).click();

        // check if authoring still open and if button save disabled
        await expect(page.locator(s('authoring')).locator(s('field-slugline'))).toHaveValue('new article 2');
        await expect(page.locator(s('authoring-topbar')).locator(s('save'))).toBeDisabled();
        await expect(page.locator(s('monitoring-view')).locator(s('article-item=new article 2'))).toBeVisible();

        // close authoring
        await page.locator(s('authoring-topbar')).locator(s('close')).click();
        await expect(page.locator(s('authoring'))).not.toBeVisible();
    });

    test('Add widget to custom workspace dashboard', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        await monitoring.selectDeskOrWorkspace('Workspace 1');

        // go to dashboard
        await page.locator('[data-test-id="Dashboard"]').click();

        // add widget
        await page.locator(s('add-widget')).click();
        await page.locator(s('modal-widget')).locator('li', {hasText: 'World Clock'}).click();
        await page.locator(s('modal-widget')).getByRole('button', {name: 'Add This Widget'}).click();
        await page.locator(s('modal-widget')).getByRole('button', {name: 'Done'}).click();

        // check if exist in dashboard
        await expect(
            page.locator(s('dashboard')).locator(s('widget-list')).locator('li', {hasText: 'World Clock'}),
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

        // confirm spike
        await expect(page.locator(s('custom-modal')).getByRole('dialog')).toBeVisible();
        await page.locator(s('custom-modal')).getByRole('button', {name: 'spike'}).click();

        // check is article removed form monitoring
        await expect(page.locator(s('monitoring-view')).locator(s('article-item=story 2'))).not.toBeVisible();

        // go to spake item list and check visibility of article
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
