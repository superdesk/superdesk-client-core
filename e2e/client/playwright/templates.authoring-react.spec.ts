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

    await authoring.saveAsTemplate('story 2-react');

    await page.goto('/#/settings/templates');
    await expect(page.locator(s('template-content', 'content-template=story 2-react'))).toBeVisible();
});

test('saving an article that has no keywords as a template (authoring-react)', async ({page}) => {
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

    // SDESK-7800: a null keywords value used to fail content_templates validation,
    // leaving the modal open with an error. saveAsTemplate asserts the modal closes,
    // so the save must now complete for an article whose keywords are null.
    await authoring.saveAsTemplate('story 2 no-keywords');

    await page.goto('/#/settings/templates');
    await expect(
        page.locator(s('template-content', 'content-template=story 2 no-keywords')),
    ).toBeVisible();
});
