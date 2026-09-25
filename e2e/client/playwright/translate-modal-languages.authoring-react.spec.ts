import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test.describe('translate modal (authoring-react)', () => {
    // The destinations-only rule is covered by the unit test. Whether `GET /languages` keeps
    // `destination: false` has not been checked, so it may be testable here too.
    test('language list never offers the language the article is already in', async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        // "test sports story" is in English.
        await monitoring.getArticleLocator('test sports story').dblclick();

        const actionsMenu = page.getByRole('button', {name: 'Actions menu'});

        await expect(actionsMenu).toBeVisible();
        await actionsMenu.click();
        await expect(page.getByTestId('actions-list')).toBeVisible();
        await page.getByRole('menuitem', {name: 'Translate item to'}).click();

        // The empty first option is the Select's placeholder.
        await expect(page.getByTestId('translate-modal--languages').locator('option'))
            .toHaveText(['', 'Nederlands', 'Français', 'Deutsch', 'Español']);
    });
});
