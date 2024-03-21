import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('highlights', async () => {
    test('creating new global highlights', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/settings/highlights');

        await page.getByRole('button', {name: 'Create configuration'}).click();
        await page.locator(s('highlight-configuration-modal')).getByLabel('Configuration name').fill('Highlight 2');
        await page.locator(s('highlight-configuration-modal')).getByRole('button', {name: 'Save'}).click();
        await expect(page.locator(s('highlights-list')).getByTitle('Highlight 2')).toBeVisible();

        await page.goto('/#/workspace');

        await monitoring.selectDeskOrWorkspace('Sports');
        await page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlights'}).hover();
        await expect(page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlight 2'})).toBeVisible();

        await monitoring.selectDeskOrWorkspace('Educations');
        await page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlights'}).hover();
        await expect(page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlight 2'})).toBeVisible();
    });

    test('creating new highlights assigned to desk', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/settings/highlights');

        await page.getByRole('button', {name: 'Create configuration'}).click();
        await page.locator(s('highlight-configuration-modal')).getByLabel('Configuration name').fill('Highlight 2');
        await page.locator(s('highlight-configuration-modal', 'desk-checkbox=Sports')).click();
        await page.locator(s('highlight-configuration-modal')).getByRole('button', {name: 'Save'}).click();
        await expect(page.locator(s('highlights-list')).getByTitle('Highlight 2')).toBeVisible();

        await page.goto('/#/workspace');

        await monitoring.selectDeskOrWorkspace('Sports');
        await page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlights'}).hover();
        await expect(page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlight 2'})).toBeVisible();

        await monitoring.selectDeskOrWorkspace('Educations');
        await page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlights'}).hover();
        await expect(
            page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlight 2'}),
        ).not.toBeVisible();
    });

    test('adding item to highlight list', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        await monitoring.selectDeskOrWorkspace('Sports');
        await expect(page.locator(s('article-item=test sports story', 'highlights-indicator'))).not.toBeVisible();
        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=test sports story')),
            'Mark for highlight',
            'Highlight 1',
        );
        await expect(page.locator(s('article-item=test sports story', 'highlights-indicator'))).toBeVisible();

        // check visibility of article in highlight list
        await page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlights'}).hover();
        await page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlight 1'}).click();
        await expect(page.locator(s('articles-list', 'article-item=test sports story'))).toBeVisible();
    });

    test('creating highlights package', async ({page}) => {
        // this test requires an article created on today's date

        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        // create fresh article
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.createArticleFromTemplate('story', {slugline: 'article 1'});
        await page.locator(s('authoring-topbar', 'save')).click();

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=article 1')),
            'Mark for highlight',
            'Highlight 1',
        );

        // create package highlights
        await page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlights'}).hover();
        await page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlight 1'}).click();
        await page.locator(s('articles-list--toolbar')).getByRole('button', {name: 'Create'}).click();
        await expect(page.locator(s('authoring', 'package-items=article 1'))).toBeVisible();
        await page.locator(s('authoring', 'package-title')).fill('Package Highlight 2');
        await page.locator(s('authoring-topbar')).getByRole('button', {name: 'Save'}).click();
        await expect(
            page.locator(s('authoring-topbar')).getByRole('button', {name: 'Save'}).locator(s('loading-indicator')),
        ).toBeVisible();
        await expect(
            page.locator(s('authoring-topbar')).getByRole('button', {name: 'Save'}).locator(s('loading-indicator')),
        ).not.toBeVisible();
        await page.locator(s('authoring-topbar', 'close')).click();

        // check visibility of highlight
        await page.goto('/#/workspace/monitoring');
        await expect(page.locator(s('monitoring-view', 'article-item=Package Highlight 2'))).toBeVisible();
    });

    test('publishing highlights package', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        await monitoring.selectDeskOrWorkspace('Sports');
        await expect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=Package Highlight 1')),
        ).toBeVisible();
        await expect(
            page.locator(s('monitoring-group=Sports desk output', 'article-item=Package Highlight 1')),
        ).not.toBeVisible();

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=Package Highlight 1')),
            'Edit',
        );

        await page.locator(s('authoring-topbar', 'open-send-publish-pane')).click();
        await page.locator(s('interactive-actions-panel', 'publish')).click();

        await expect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=Package Highlight 1')),
        ).not.toBeVisible();
        await expect(
            page.locator(s('monitoring-group=Sports desk output', 'article-item=Package Highlight 1')),
        ).toBeVisible();
    });

    test('exporting highlights', async ({page}) => {
        // this test requires an article created on today's date

        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        // create fresh article
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.createArticleFromTemplate('story', {slugline: 'article 1', body_html: 'body html article'});
        await page.locator(s('authoring-topbar', 'save')).click();

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=article 1')),
            'Mark for highlight',
            'Highlight 1',
        );

        // create and export package highlights
        await page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlights'}).hover();
        await page.locator(s('workspace-navigation')).getByRole('button', {name: 'Highlight 1'}).click();
        await page.locator(s('articles-list--toolbar')).getByRole('button', {name: 'Create'}).click();
        await page.locator(s('authoring-topbar')).getByRole('button', {name: 'Export'}).click();
        await page.locator(s('modal-confirm')).getByRole('button', {name: 'ok'}).click();

        // checking if the package inherits the body_html of the article
        await expect(
            page.locator(s('authoring', 'authoring-field=body_html')).getByRole('textbox'),
        ).toHaveText('body html article');
    });
});
