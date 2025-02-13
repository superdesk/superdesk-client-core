import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {MultiEdit} from './page-object-models/multiedit';
import {restoreDatabaseSnapshot, s, sleep} from './utils';
import {clearInput} from './utils/inputs';
import {TreeSelectDriver} from './utils/tree-select-driver';

test.describe('Multiedit', async () => {
    test.skip('editing articles in multi-edit mode', async ({page}) => {
        const monitoring = new Monitoring(page);
        const multiedit = new MultiEdit(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeBulkAction('Multi-edit', ['test sports story', 'story 2']);

        const item1HeadlineLocator = page.locator(
            s('multiedit-screen', 'multiedit-article=test sports story', 'field--headline'),
        ).getByRole('textbox');

        const item2HeadlineLocator = page.locator(
            s('multiedit-screen', 'multiedit-article=story 2', 'field--headline'),
        ).getByRole('textbox');

        await clearInput(item1HeadlineLocator);

        await item1HeadlineLocator.fill('test sports story 1.1');

        await multiedit.save('test sports story');

        await clearInput(item2HeadlineLocator);

        await item2HeadlineLocator.fill('story 2.1');

        await multiedit.save('story 2');

        /**
         * TAG: AUTHORING-ANGULAR implementation is unreliable and "Exit" button doesn't always work
         */
        page.waitForTimeout(1000);

        await page.locator(s('multiedit-subnav')).getByRole('button', {name: 'Exit'}).click();

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=test sports story 1.1')),
            'Edit',
        );
        await expect(
            page.locator(s('authoring', 'field--headline')).getByRole('textbox'),
        ).toHaveText('test sports story 1.1');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=story 2.1')),
            'Edit',
        );
        await expect(
            page.locator(s('authoring', 'field--headline')).getByRole('textbox'),
        ).toHaveText('story 2.1');
    });

    test('removing an article from multi-edit view', async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=story 2')),
            'Edit',
        );

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=test sports story')),
            'Edit',
        );
        await sleep(2000);
        await authoring.executeActionInEditor(
            'Multi-edit',
        );

        await new TreeSelectDriver(
            page,
            page.locator(s('multi-edit-modal')),
        ).addValue(['story 2']);

        await page.locator(s('multi-edit-modal')).getByRole('button', {name: 'open multi edit'}).click();

        // test-pr-TODO: there is no option to remove item from multiedit screen
        await page.locator(s('multiedit-screen', 'multiedit-article=test sports story')).hover();
        await page
            .locator(s('multiedit-screen', 'multiedit-article=test sports story'))
            .getByRole('button', {name: 'remove item'})
            .click();
        await expect(page.locator(s('multiedit-screen', 'multiedit-article=test sports story'))).not.toBeVisible();
    });
});
