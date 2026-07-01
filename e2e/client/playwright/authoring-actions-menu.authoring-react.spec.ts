import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test.describe('authoring actions menu groups', () => {
    test('actions are grouped in the three-dot menu (authoring-react)', async ({page}) => {
        await restoreDatabaseSnapshot();
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        // Open an article in React authoring
        await monitoring.getArticleLocator('test sports story').dblclick();
        await page.waitForTimeout(2000); // wait for authoring-react to initialize

        // Open the actions menu
        await page.getByRole('button', {name: 'Actions menu'}).click();

        // The menu renders in a portal; assert it's visible
        const menu = page.getByTestId('actions-list');

        await expect(menu).toBeVisible();

        // General actions (ungrouped, flat list at the top)
        await expect(menu.getByRole('menuitem', {name: 'Save as template'})).toBeVisible();
        await expect(menu.getByRole('menuitem', {name: 'Compare versions'})).toBeVisible();
        await expect(menu.getByRole('menuitem', {name: 'Multiedit'})).toBeVisible();

        // Highlights section — action items exist, but group label does NOT
        await expect(menu.getByRole('menuitem', {name: 'Highlights'})).toBeVisible();
        // Exactly 1 "Highlights" menuitem means only the action is present, not a group label
        await expect(menu.getByRole('menuitem', {name: 'Highlights'})).toHaveCount(1);
        await expect(menu.getByRole('menuitem', {name: 'Marked for desks'})).toBeVisible();

        // Spell Checker group label exists
        await expect(menu.getByRole('menuitem', {name: 'Spell Checker'})).toBeVisible();
    });
});
