import {test, expect, type Locator, type Page} from '@playwright/test';
import {InteractiveActionsPanel} from './page-object-models/interactive-actions-panel';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

/**
 * QA case "Send item to Personal space" (Confluence 1344443788), whose expected results
 * come from the tickets it links: SDANSA-424, SDANSA-466 and SDESK-5609.
 *
 * Covered:
 *  - the feature is off unless `features.sendToPersonal` is configured (SDANSA-424);
 *  - "Personal space" is offered as a destination in the Send to panel opened from the
 *    monitoring context menu, from authoring and from a multi selection (SDANSA-424, SDANSA-466);
 *  - sending removes the item from the desk and leaves it available only in the personal
 *    space (SDANSA-424);
 *  - the shortcut action "Send to Personal Space" in the item context menu (SDANSA-424);
 *  - items already in the personal space offer neither the shortcut action nor the
 *    "Personal space" destination (SDESK-5609).
 *
 * Not covered:
 *  - the `send_to_personal` user privilege gate (SDANSA-424: "I expect to have a user privilege
 *    for Send items to personal space"). Blocker: missing fixture. The `main` snapshot ships no
 *    roles and its only usable login is the administrator, who implicitly holds every privilege,
 *    so there is no way to log in as a user that has the ordinary authoring privileges but not
 *    `send_to_personal`.
 */

const PERSONAL_SPACE = 'Personal space';
const SPORTS_WORKING_STAGE = 'Sports / Working Stage';
const PERSONAL_ITEMS = 'Personal Items';

function articleInGroup(page: Page, group: string, article: string): Locator {
    return page.getByTestId('monitoring-group').and(page.locator(`[data-test-value="${group}"]`))
        .getByTestId('article-item').and(page.locator(`[data-test-value="${article}"]`));
}

test.describe('sending an item to the personal space', {
    annotation: [
        {type: 'confluence', description: '1344443788 partial'}, // Send item to Personal space
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

            // sending the item that is currently open closes authoring
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
            const panel = new InteractiveActionsPanel(page);
            const article = articleInGroup(page, PERSONAL_ITEMS, 'personal space article 1');

            await restoreDatabaseSnapshot();
            await page.goto('/#/workspace/personal');

            await article.hover();
            await article.getByTestId('context-menu-button').click();

            const contextMenu = page.getByTestId('context-menu');
            const sendTo = contextMenu.getByRole('button', {name: 'Send to', exact: true});

            await expect(sendTo).toBeVisible();
            await expect(
                contextMenu.getByRole('button', {name: 'Send to Personal Space', exact: true}),
            ).toHaveCount(0);

            await sendTo.click();

            const destinations = await panel.openDestinationOptions();

            await expect(destinations.getByRole('treeitem', {name: 'Education', exact: true})).toBeVisible();
            await expect(destinations.getByRole('treeitem', {name: PERSONAL_SPACE, exact: true})).toHaveCount(0);
        });
    });

    test('does not offer the personal space when the feature is not enabled', async ({page}) => {
        const monitoring = new Monitoring(page);
        const panel = new InteractiveActionsPanel(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const article = articleInGroup(page, SPORTS_WORKING_STAGE, 'story 2');

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
    });
});
