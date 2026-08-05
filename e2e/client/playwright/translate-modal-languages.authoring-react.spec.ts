import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test.describe('translate modal (authoring-react)', () => {
    /**
     * Only the current-language rule is asserted here. The destinations-only rule is covered by the
     * unit test on `getTranslationTargetLanguages` instead.
     *
     * Why it is not covered end to end is NOT settled, so do not treat it as impossible. One reading
     * is that `GET /languages` reports every language as a destination whatever the vocabulary says,
     * because the flag is dropped server-side before `view_language` applies its `setdefault`.
     * The other is that an explicit `destination: false` survives that path, since `setdefault` only
     * fills a missing key. Neither has been reproduced against a running server. If you need this
     * rule covered, check first rather than inheriting the assumption that it cannot be.
     */
    test('language list never offers the language the article is already in', async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        // "test sports story" is in English.
        await monitoring.getArticleLocator('test sports story').dblclick();

        // The actions menu is rendered by authoring-react, so waiting for it also waits for it to initialize.
        const actionsMenu = page.getByRole('button', {name: 'Actions menu'});

        await expect(actionsMenu).toBeVisible();
        await actionsMenu.click();
        await expect(page.getByTestId('actions-list')).toBeVisible();
        await page.getByRole('menuitem', {name: 'Translate item to'}).click();

        // First entry is the empty placeholder option the Select renders.
        await expect(page.getByTestId('translate-modal--languages').locator('option'))
            .toHaveText(['', 'Nederlands', 'Français', 'Deutsch', 'Español']);
    });
});
