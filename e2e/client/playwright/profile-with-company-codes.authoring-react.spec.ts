import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {login, restoreDatabaseSnapshot} from './utils';
import {getLoggedOutStorageState} from './utils/storage-state';

/**
 * `legacy`'s "Plain text" profile enables `company_codes`, which authoring-react has no field adapter for, so
 * `getContentProfile` treats it as a custom field and throws on its missing vocabulary: the editor renders nothing.
 * It is also the profile the angular attachment cases run on.
 */
test.use({storageState: getLoggedOutStorageState({authoringReact: true})});

// React gap: an item whose profile enables `company_codes` opens a blank editor (data-layer.ts, custom field branch).
test.fixme('an item on a profile with company codes opens with its fields', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'legacy'});
    await login(page);

    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Politic Desk');
    await monitoring.editItem(
        page.getByTestId('article-item').and(page.locator('[data-test-value="item5"]')).first(),
        page.getByTestId('authoring'),
    );

    await expect(authoring.fieldContainer('headline')).toBeVisible();
    await expect(authoring.fieldContainer('attachments')).toBeVisible();
});
