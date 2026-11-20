import {test, expect, type Locator, type Page} from '@playwright/test';
import {InteractiveActionsPanel} from './page-object-models/interactive-actions-panel';
import {Monitoring} from './page-object-models/monitoring';
import {loginAs, restoreDatabaseSnapshot} from './utils';
import {getLoggedOutStorageState, getStorageState} from './utils/storage-state';

/**
 * QA case "Send item to Personal space" (Confluence 1344443788); expected results come from
 * SDANSA-424, SDANSA-466 and SDESK-5609.
 */

const PERSONAL_SPACE = 'Personal space';
const SPORTS_WORKING_STAGE = 'Sports / Working Stage';
const PERSONAL_ITEMS = 'Personal Items';

function articleInGroup(page: Page, group: string, article: string): Locator {
    return page.getByTestId('monitoring-group').and(page.locator(`[data-test-value="${group}"]`))
        .getByTestId('article-item').and(page.locator(`[data-test-value="${article}"]`));
}

async function expectPersonalSpaceNotOffered(page: Page, article: Locator): Promise<void> {
    const panel = new InteractiveActionsPanel(page);

    await article.hover();
    await article.getByTestId('context-menu-button').click();

    const contextMenu = page.getByTestId('context-menu');
    const sendTo = contextMenu.getByRole('button', {name: 'Send to', exact: true});

    await expect(sendTo).toBeVisible();
    await expect(contextMenu.getByRole('button', {name: 'Send to Personal Space', exact: true})).toHaveCount(0);

    await sendTo.click();

    const destinations = await panel.openDestinationOptions();

    await expect(destinations.getByRole('treeitem', {name: 'Education', exact: true})).toBeVisible();
    await expect(destinations.getByRole('treeitem', {name: PERSONAL_SPACE, exact: true})).toHaveCount(0);
}

test.describe('sending an item to the personal space', {
    annotation: [
        {type: 'confluence', description: '1344443788 complete'}, // Send item to Personal space
    ],
}, () => {
    test.describe('with the feature enabled', () => {
        test.use({storageState: getStorageState({features: {sendToPersonal: true}})});

        test('sends an item from a desk to the personal space via the Send to panel', async ({page}) => {
            const monitoring = new Monitoring(page);
            const panel = new InteractiveActionsPanel(page);

            await restoreDatabaseSnapshot();
            await page.goto('/#/workspace/monitoring');
            await monitoring.selectDeskOrWorkspace('Sports');

            await monitoring.executeActionOnMonitoringItem(
                articleInGroup(page, SPORTS_WORKING_STAGE, 'story 2'),
                'Send to',
            );

            const destinations = await panel.openDestinationOptions();
            const personalSpace = destinations.getByRole('treeitem', {name: PERSONAL_SPACE, exact: true});

            await expect(personalSpace).toBeVisible();
            await personalSpace.click();

            // the stage picker only applies to desk destinations
            await expect(panel.root.getByTestId('stage-select')).toBeHidden();

            await panel.send();

            await expect(articleInGroup(page, SPORTS_WORKING_STAGE, 'story 2')).toBeHidden();

            await page.goto('/#/workspace/personal');
            await expect(articleInGroup(page, PERSONAL_ITEMS, 'story 2')).toBeVisible();
        });

        test('sends an item from a desk to the personal space from the authoring send panel', async ({page}) => {
            const monitoring = new Monitoring(page);
            const panel = new InteractiveActionsPanel(page);

            await restoreDatabaseSnapshot();
            await page.goto('/#/workspace/monitoring');
            await monitoring.selectDeskOrWorkspace('Sports');

            await monitoring.executeActionOnMonitoringItem(
                articleInGroup(page, SPORTS_WORKING_STAGE, 'test sports story'),
                'Edit',
            );

            await panel.openSendToFromAuthoring();
            await panel.selectDestination(PERSONAL_SPACE);
            await panel.send();

            // sending the open item closes authoring
            await expect(page.getByTestId('authoring-topbar')).toBeHidden();
            await expect(articleInGroup(page, SPORTS_WORKING_STAGE, 'test sports story')).toBeHidden();

            await page.goto('/#/workspace/personal');
            await expect(articleInGroup(page, PERSONAL_ITEMS, 'test sports story')).toBeVisible();
        });

        test('sends a multi selection to the personal space', async ({page}) => {
            const monitoring = new Monitoring(page);
            const panel = new InteractiveActionsPanel(page);

            await restoreDatabaseSnapshot();
            await page.goto('/#/workspace/monitoring');
            await monitoring.selectDeskOrWorkspace('Sports');

            await monitoring.executeBulkAction('Send to', ['story 2', 'test sports story']);

            await panel.selectDestination(PERSONAL_SPACE);
            await panel.send();

            await expect(articleInGroup(page, SPORTS_WORKING_STAGE, 'story 2')).toBeHidden();
            await expect(articleInGroup(page, SPORTS_WORKING_STAGE, 'test sports story')).toBeHidden();

            await page.goto('/#/workspace/personal');
            await expect(articleInGroup(page, PERSONAL_ITEMS, 'story 2')).toBeVisible();
            await expect(articleInGroup(page, PERSONAL_ITEMS, 'test sports story')).toBeVisible();
        });

        test('sends an item to the personal space with the context menu shortcut', async ({page}) => {
            const monitoring = new Monitoring(page);

            await restoreDatabaseSnapshot();
            await page.goto('/#/workspace/monitoring');
            await monitoring.selectDeskOrWorkspace('Sports');

            await monitoring.executeActionOnMonitoringItem(
                articleInGroup(page, SPORTS_WORKING_STAGE, 'story 2'),
                'Send to Personal Space',
            );

            await expect(articleInGroup(page, SPORTS_WORKING_STAGE, 'story 2')).toBeHidden();

            await page.goto('/#/workspace/personal');
            await expect(articleInGroup(page, PERSONAL_ITEMS, 'story 2')).toBeVisible();
        });

        test('does not offer the personal space for an item that is already there', async ({page}) => {
            await restoreDatabaseSnapshot();
            await page.goto('/#/workspace/personal');

            await expectPersonalSpaceNotOffered(page, articleInGroup(page, PERSONAL_ITEMS, 'personal space article 1'));
        });

        test.describe('for a user without the send_to_personal privilege', () => {
            // the committed admin session would skip the login form
            test.use({
                storageState: getLoggedOutStorageState({appConfigPatch: {features: {sendToPersonal: true}}}),
            });

            test('does not offer the personal space', async ({page}) => {
                const monitoring = new Monitoring(page);

                await restoreDatabaseSnapshot();

                // the `Sub Editor` role sets `send_to_personal` to 0
                await loginAs(page, 'samgamgee', 'samgamgee');
                await page.goto('/#/workspace/monitoring');
                await monitoring.selectDeskOrWorkspace('Sports');

                await expectPersonalSpaceNotOffered(page, articleInGroup(page, SPORTS_WORKING_STAGE, 'story 2'));
            });
        });
    });

    test('does not offer the personal space when the feature is not enabled', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await expectPersonalSpaceNotOffered(page, articleInGroup(page, SPORTS_WORKING_STAGE, 'story 2'));
    });
});
