import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState(
        {
            features: {
                customAuthoringTopbar: {
                    sendAndDuplicate: {
                        deskName: 'Education',
                        stageName: 'Incoming Stage',
                    },
                },
            },
        },
        {authoringReact: true},
    ),
});

test('duplicating an article to a pre-configured desk and stage (authoring-react)', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        'Edit',
    );

    await authoring.waitForAuthoringReactToInitialize();

    await setEditor3FieldValue(
        page.locator(s('authoring-field=slugline')).getByRole('textbox'),
        'story 2.1',
    );

    await page.locator(s('authoring', 'authoring-toolbar-1'))
        .getByRole('button', {name: 'Send and duplicate'})
        .click();

    await page.locator(s('unsaved-changes-dialog')).getByRole('button', {name: 'Save'}).click();

    await expect(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2.1')),
    ).toBeVisible();

    await monitoring.selectDeskOrWorkspace('Education');

    await expect(
        page.locator(s('monitoring-group=Education / Incoming Stage', 'article-item=story 2.1')),
    ).toBeVisible();
});
