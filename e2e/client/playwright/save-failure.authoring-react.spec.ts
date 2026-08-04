import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test.setTimeout(60000);

test('recovering from a failed save (authoring-react)', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator('Sports / Working Stage', 'test sports story'),
        'Edit',
    );

    await authoring.waitForAuthoringReactToInitialize();

    await setEditor3FieldValue(
        page.getByTestId('authoring')
            .getByTestId('authoring-field')
            .and(page.locator('[data-test-value="headline"]'))
            .getByRole('textbox'),
        'test sports story [edited]',
    );

    await page.route('**/api/archive/*', (route) => {
        if (route.request().method() === 'PATCH') {
            return route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    _status: 'ERR',
                    _issues: {headline: 'empty values not allowed'},
                    _error: {code: 400, message: 'Insertion failure: 1 document(s) contain(s) error(s)'},
                }),
            });
        }

        return route.fallback();
    });

    const saveButton = page.getByTestId('authoring').getByRole('button', {name: 'Save', exact: true});

    await saveButton.click();

    await expect(
        page.getByTestId('notification--error').filter({hasText: 'Item not updated'}),
    ).toBeVisible();

    // the loading overlay must be gone; the Loader component carries no test id
    await expect(page.getByTestId('authoring').locator('.sd-loader')).toHaveCount(0);

    await page.unroute('**/api/archive/*');
    await saveButton.click();

    // a successful save resets unsaved changes, which disables the save button
    await expect(saveButton).toBeDisabled();
    await expect(
        monitoring.getGroupedArticleLocator('Sports / Working Stage', 'test sports story [edited]'),
    ).toBeVisible();
});
