import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test('performing "save as" action on a template (authoring-react)', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.createArticleFromTemplate('story 2');

    await authoring.waitForAuthoringReactToInitialize();

    // Menu items render in a portal, outside the actions-list test-id wrapper.
    await page.getByRole('button', {name: 'Actions menu'}).click();
    await page.getByText('Save as template', {exact: true}).click();

    const modal = page.locator(s('modal-save-as-template'));

    await expect(modal).toBeVisible();

    await modal.getByLabel('Template name').fill('story 2-react');
    await modal.getByRole('button', {name: 'Save'}).click();

    await expect(modal).not.toBeVisible();

    await page.goto('/#/settings/templates');
    await expect(page.locator(s('template-content', 'content-template=story 2-react'))).toBeVisible();
});
