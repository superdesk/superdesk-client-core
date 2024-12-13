import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('content profile icon', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();

    // expect an article to have a regular text icon

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await expect(
        page.locator(s(
            'monitoring-group=Sports / Working Stage',
            'article-item=test sports story',
            'type-icon',
        )),
    ).toHaveAttribute('data-test-value', 'text');


    // go to content profile and set icon to "map-marker"

    await page.goto('/#/settings/content-profiles');
    await page.locator(s('content-profile=Story', 'content-profile-actions')).click();
    await page.locator(s('content-profile-actions--options')).getByRole('button', {name: 'Edit'}).click();

    await page.locator(s('content-profile-edit-view')).getByLabel('Icon').getByRole('button').click();
    await page.getByRole('button', {name: 'map-marker'}).click();
    await page.locator(s('content-profile-edit-view--footer')).getByRole('button', {name: 'Save'}).click();

    await expect(page.locator(s('content-profile=Story', 'icon'))).toHaveAttribute('data-test-value', 'map-marker');


    // go back to monitoring and test whether the newly set icon is being used

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await expect(
        page.locator(s(
            'monitoring-group=Sports / Working Stage',
            'article-item=test sports story',
            'type-icon',
        )),
    ).toHaveAttribute('data-test-value', 'map-marker', {timeout: 10000});
});
