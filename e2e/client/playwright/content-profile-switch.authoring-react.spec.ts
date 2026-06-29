import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test('switching content profile applies silently and persists (authoring-react)', async ({page}) => {
    await restoreDatabaseSnapshot();
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
        'Edit',
    );

    await authoring.waitForAuthoringReactToInitialize();

    const profileSelect = page.locator(s('content-profile-select'));

    // The article starts on the Story profile.
    await expect(profileSelect).toHaveAttribute('data-test-value', '655494fc71839faddb615a24');

    // Switch to the stock "Text" profile. Its editor fields have no section (legacy config), so this
    // also exercises the section-less profile handling: it must build instead of throwing.
    await profileSelect.selectOption({label: 'Text'});

    // Legacy switches silently: no "Save changes?" prompt.
    await expect(page.getByText('Save changes?')).toHaveCount(0);

    // The switch applied: the select reflects the Text profile and the editor still renders.
    await expect(profileSelect).toHaveAttribute('data-test-value', 'text');
    await expect(page.locator(s('authoring', 'authoring-field=body_html'))).toBeVisible();

    // Wait out the debounced autosave the switch triggers, then assert it did not error
    // (the switch used to PATCH keywords: null and 500).
    await page.waitForTimeout(4000);
    await expect(page.locator(s('notifications', 'notification--error'))).toHaveCount(0);
});
