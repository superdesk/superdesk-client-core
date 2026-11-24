import {test, expect, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {PackageAuthoring} from './page-object-models/authoring';
import {AuthoringReact} from './page-object-models/authoring-react';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

/**
 * QA case "Create new empty package" (1308524902) on authoring-react. The "+" menu cases of the
 * angular spec do not open authoring and are covered there for both editors.
 */
test.use({storageState: getStorageState({}, {authoringReact: true})});

const HEADLINE = 'empty package headline';
const SLUGLINE = 'empty-package-slugline';

async function createAndFillPackage(page: Page): Promise<PackageAuthoring> {
    const monitoring = new Monitoring(page);
    const authoring = new PackageAuthoring(page);

    await monitoring.openMonitoringForDesk('Sports');
    await expect(monitoring.getListedArticle('test sports story')).toBeVisible();

    await monitoring.createEmptyPackage();

    await expect(authoring.fieldContainer('groups')).toBeVisible();
    await expect(authoring.fieldContainer('groups').getByTestId('package-items')).toHaveCount(0);

    await authoring.waitForAuthoringReactToInitialize();
    await authoring.replaceEditor3FieldText(authoring.fieldContainer('headline').getByRole('textbox'), HEADLINE);
    await authoring.replaceEditor3FieldText(authoring.fieldContainer('slugline').getByRole('textbox'), SLUGLINE);

    return authoring;
}

test.describe('creating a new empty package (authoring-react)', {
    annotation: [
        {type: 'confluence', description: '1308524902 complete'}, // Create new empty package
    ],
}, () => {
    test('the topbar Save keeps the package open and persists the fields', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();

        const authoring = await createAndFillPackage(page);

        await authoring.saveAndGetRequest();
        await expect(authoring.fieldContainer('groups')).toBeVisible();
        await expect(monitoring.getListedArticle(HEADLINE)).toBeVisible();

        await authoring.close();

        await monitoring.editItem(monitoring.getListedArticle(HEADLINE), authoring.fieldContainer('groups'));
        await expect(authoring.fieldContainer('headline')).toContainText(HEADLINE);
        await expect(authoring.fieldContainer('slugline')).toContainText(SLUGLINE);
    });

    test('Save in the unsaved changes dialog creates the package and closes it', async ({page}) => {
        const monitoring = new Monitoring(page);
        const editor = new AuthoringReact(page);

        await restoreDatabaseSnapshot();

        await createAndFillPackage(page);

        await editor.closeButton.click();
        await expect(editor.unsavedChangesDialog).toBeVisible();
        await editor.unsavedChangesDialog.getByRole('button', {name: 'Save', exact: true}).click();

        await expect(editor.root).toBeHidden();
        await expect(monitoring.getListedArticle(HEADLINE)).toBeVisible();
    });

    test('Cancel returns to the package and Ignore discards it', async ({page}) => {
        const monitoring = new Monitoring(page);
        const editor = new AuthoringReact(page);

        await restoreDatabaseSnapshot();

        const authoring = await createAndFillPackage(page);

        await editor.closeButton.click();
        await expect(editor.unsavedChangesDialog).toBeVisible();
        await editor.unsavedChangesDialog.getByRole('button', {name: 'Cancel', exact: true}).click();
        await expect(editor.unsavedChangesDialog).toBeHidden();
        await expect(authoring.fieldContainer('headline')).toContainText(HEADLINE);

        await editor.closeButton.click();
        await editor.unsavedChangesDialog.getByRole('button', {name: 'Ignore', exact: true}).click();
        await expect(editor.root).toBeHidden();

        // anchor: the list has rendered before the absence is checked
        await expect(monitoring.getListedArticle('test sports story')).toBeVisible();
        await expect(monitoring.getListedArticle(HEADLINE)).toHaveCount(0);
    });
});
