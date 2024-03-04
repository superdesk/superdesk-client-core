import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('Personal Space', async () => {
    test('Create and edit article in Personal space', async ({page}) => {
        const articleTemplateSlugline = async (slugline) => {
            await page.locator(s('monitoring-view')).locator(s('content-create')).click();
            await page.locator(s('default-desk-template')).click();
            await page.locator(s('authoring')).locator(s('field-slugline')).fill(slugline);
        };

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await page.locator(s('Personal space')).click();

        // create article
        await articleTemplateSlugline('new article');
        await page.locator(s('authoring-topbar')).locator(s('close')).click();
        await page.locator(s('options-modal')).getByRole('button', {name: 'save'}).click();

        // check visibility of article
        await expect(page.locator(s('monitoring-group=Personal Items', 'article-item=new article'))).toBeVisible();

        // edit article
        await page.hover(s('article-item=new article'));
        await page.locator(s('monitoring-view')).locator(s('article-item=new article', 'context-menu-button')).click();
        await page.locator(s('context-menu')).locator('button', {hasText: 'Edit', hasNotText: 'in new window'}).click();
        await page.locator(s('authoring')).locator(s('field-slugline')).fill('edited new article');
        await page.locator(s('authoring-topbar')).locator(s('save')).click();

        // check visibility of edited article
        await expect(page.locator(s('monitoring-group=Personal Items', 'article-item=new article'))).not.toBeVisible();
        await expect(
            page.locator(s('monitoring-group=Personal Items', 'article-item=edited new article')),
        ).toBeVisible();
    });

    test('Copy article in Personal space', async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await page.locator(s('Personal space')).click();

        // copy article
        await page.hover(s('article-item=personal space article 1'));
        await page.locator(
            s('monitoring-view', 'article-item=personal space article 1', 'context-menu-button'),
        ).click();
        await page.locator(s('context-menu')).locator('button', {hasText: 'copy'}).click();
    });

    test('Send item from Personal space', async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await page.locator(s('Personal space')).click();

        // send article to desk
        await page.hover(s('article-item=personal space article 1'));
        await page.locator(s('article-item=personal space article 1', 'context-menu-button')).click();
        await page.locator(s('context-menu')).locator('button', {hasText: 'send to'}).click();

        await expect(page.locator(s('interactive-actions-panel'))).toBeVisible();
        await page.locator(s('interactive-actions-panel')).locator(s('item'), {hasText: 'Working Stage'}).check();
        await page.locator(s('interactive-actions-panel')).locator(s('send')).click();

        // check if article removed from personal space
        await expect(
            page.locator(s('monitoring-group=Personal Items', 'article-item=personal space article 1')),
        ).not.toBeVisible();

        // go to monitoring and check visibility of article
        await page.goto('/#/workspace/monitoring');
        await expect(page.locator(s('monitoring-view', 'monitoring-group=Sports / Working Stage'))).toBeVisible();
    });
});
