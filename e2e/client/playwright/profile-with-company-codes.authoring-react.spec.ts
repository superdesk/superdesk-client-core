import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {login, restoreDatabaseSnapshot} from './utils';
import {createContentProfile} from './utils/content-profiles-api';
import {getLoggedOutStorageState, getStorageState} from './utils/storage-state';
import {TreeSelectDriver} from './utils/tree-select-driver';
import {addVocabularyItem, createVocabulary} from './utils/vocabularies-api';

/**
 * `legacy`'s "Plain text" profile enables `company_codes`, but `legacy` has no `company_codes` vocabulary, so the
 * field is left out and the rest of the profile must still render. It is also the profile the angular attachment
 * cases run on.
 */
test.describe('a profile with company codes and no company codes vocabulary (authoring-react)', () => {
    test.use({storageState: getLoggedOutStorageState({authoringReact: true})});

    test('an item on a profile with company codes opens with its fields', async ({page}) => {
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
});

/**
 * As in angular, the field is offered only once the item has the finance category (`f`) or a finance subject,
 * or already carries company codes.
 */
test.describe('company codes (authoring-react)', () => {
    test.use({storageState: getStorageState({}, {authoringReact: true})});

    // the vocabulary created here would otherwise reach specs that do not restore a snapshot
    test.afterEach(async () => {
        await restoreDatabaseSnapshot();
    });

    test('are offered for the finance category, and the picked code is saved', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createVocabulary({
            _id: 'company_codes',
            display_name: 'Company Codes',
            items: [{name: 'Erebor Mining', qcode: 'ERB', security_exchange: 'ASX', is_active: true}],
        });
        await addVocabularyItem('categories', {name: 'Finance', qcode: 'f', is_active: true});
        await createContentProfile('Finance', [
            {id: 'slugline', section: 'header'},
            {id: 'anpa_category', section: 'header'},
            {id: 'company_codes', section: 'header'},
            {id: 'body_html', section: 'content', formatOptions: []},
        ]);

        const monitoring = new Monitoring(page);
        const authoring = new AuthoringReact(page);
        const category = authoring.fieldContainer('anpa_category');
        const companyCodes = authoring.fieldContainer('company_codes');

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.createArticleFromTemplate('finance');
        await authoring.waitUntilOpen();

        await expect(category.getByTestId('open-popover')).toBeVisible();
        await expect(companyCodes.getByTestId('open-popover')).toHaveCount(0);

        await new TreeSelectDriver(page, category).addValues('Finance');
        await new TreeSelectDriver(page, companyCodes).addValues('Erebor Mining');

        const saved = await authoring.saveAndGetItem();

        expect(saved.company_codes).toEqual([
            expect.objectContaining({qcode: 'ERB', name: 'Erebor Mining', security_exchange: 'ASX'}),
        ]);
    });
});
