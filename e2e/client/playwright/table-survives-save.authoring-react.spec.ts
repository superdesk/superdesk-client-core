import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

/**
 * SDESK-7821. Saving destroys the table, leaving `<figure><br></figure>` on the server.
 * Angular saves the same article as `<table>...<p>cell text</p>...</table>`, so this is a
 * regression in authoring-react rather than long-standing editor3 behaviour.
 */
test('a table survives save and reopen (authoring-react)', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'editor3-tables'});

    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    const bodyField = page.getByTestId('authoring')
        .getByTestId('authoring-field')
        .and(page.locator('[data-test-value="body_html"]'));
    const tableBlock = bodyField.getByTestId('table-block');
    const saveButton = page.getByRole('button', {name: 'Save', exact: true});

    const openArticle = async () => {
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'))
            .getByTestId('article-item').filter({hasText: 'test sports story'})
            .dblclick();
        await authoring.waitForAuthoringReactToInitialize();
    };

    await openArticle();
    await expect(bodyField).toContainText('test sport story body');

    await bodyField.getByRole('button', {name: 'table'}).click();
    await expect(tableBlock).toHaveCount(1);
    await tableBlock.locator('[contenteditable]').first().pressSequentially('cell text', {delay: 50});

    await saveButton.click();
    await expect(saveButton).toBeDisabled();

    await openArticle();

    await expect(bodyField).toContainText('test sport story body');
    await expect(tableBlock).toHaveCount(1);
    await expect(tableBlock.locator('[contenteditable]').first()).toHaveText('cell text');
});
