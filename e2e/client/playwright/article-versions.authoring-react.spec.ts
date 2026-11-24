import {test, expect, type Locator, type Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({storageState: getStorageState({}, {authoringReact: true})});

function openVersionsWidget(page: Page): Promise<Locator> {
    return new AuthoringReact(page).openWidgetByIcon('versioning');
}

test.describe('article versions (authoring-react)', () => {
    test('a saved edit adds a version and an Updated entry, and Revert restores the previous version', {
        annotation: [
            {type: 'confluence', description: '1310294128 partial'}, // Versioning
            {type: 'confluence', description: '1308524925 partial'}, // Check item history
            {type: 'confluence', description: '1308524929 partial'}, // Revert to a previous version
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new AuthoringReact(page);
        const slugline = authoring.input('slugline');

        await restoreDatabaseSnapshot();
        await monitoring.openMonitoringForDesk('Sports');
        await monitoring.executeActionOnMonitoringItem(monitoring.getArticleLocator('story 2'), 'Edit');
        await authoring.waitUntilOpen();

        let panel = await openVersionsWidget(page);
        const versionActions = panel.getByTestId('article-version-actions');

        await expect(versionActions.first()).toBeVisible();

        const versionsBefore = await versionActions.count();

        await authoring.replaceEditor3FieldText(slugline, 'story 2.1');
        await authoring.saveAndGetRequest();

        // toggled shut and open, to tell a stale list from a missing version
        await authoring.widgetTab('versioning').click();
        await expect(panel).toBeHidden();
        panel = await openVersionsWidget(page);
        await expect(versionActions).toHaveCount(versionsBefore + 1);

        await panel.getByRole('tab', {name: 'Item history'}).click();
        await expect(panel.getByText('Updated by').first()).toBeVisible();
        await expect(panel.getByText('slugline').first()).toBeVisible();

        await panel.getByRole('tab', {name: 'Versions'}).click();

        // newest first, so the second card is the version before the save
        await versionActions.nth(1).getByRole('button', {name: 'Revert'}).click();

        await expect(slugline).toHaveText('story 2');
        await expect(versionActions).toHaveCount(versionsBefore + 2);
    });
});

// React gap: the open Versions/History widget keeps its list after a save; angular adds the new version.
test.fixme('the open versions widget lists the version a save creates', {
    annotation: [
        {type: 'confluence', description: '1310294128 partial'}, // Versioning
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await monitoring.openMonitoringForDesk('Sports');
    await monitoring.executeActionOnMonitoringItem(monitoring.getArticleLocator('story 2'), 'Edit');
    await authoring.waitForAuthoringReactToInitialize();

    const panel = await openVersionsWidget(page);
    const versionActions = panel.getByTestId('article-version-actions');

    await expect(versionActions.first()).toBeVisible();

    const versionsBefore = await versionActions.count();

    await authoring.replaceEditor3FieldText(authoring.fieldContainer('slugline').getByRole('textbox'), 'story 2.1');
    await authoring.saveAndGetRequest();

    await expect(versionActions).toHaveCount(versionsBefore + 1);
});
