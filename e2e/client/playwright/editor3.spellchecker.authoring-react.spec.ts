import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test('adding a word to the dictionary removes its spellchecker warnings (authoring-react)', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'spellchecker'});
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=spellchecker test'),
    ).dblclick();

    // Wait for editor3 + dictionary to load. Mirrors the legacy spec; no UI
    // indicator exists for "spellchecker ready".
    await page.waitForTimeout(3000);

    const warnings = page.locator(s('authoring', 'authoring-field=body_html', 'spellchecker-warning'));

    await expect(warnings).toHaveCount(2);

    await warnings.first().click({button: 'right'});

    await page.locator(s('spellchecker-menu')).getByRole('button', {name: 'Add to dictionary'}).click();

    await expect(warnings).toHaveCount(0);
});

test('toggling spellchecker on/off shows/clears warnings (authoring-react)', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'spellchecker'});
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=spellchecker test'),
    ).dblclick();

    await page.waitForTimeout(3000);

    const warnings = page.locator(s('authoring', 'authoring-field=body_html', 'spellchecker-warning'));

    await expect(warnings).toHaveCount(2);

    await page.getByRole('button', {name: 'Actions menu'}).click();
    await page.getByRole('menuitem', {name: 'Run automatically'}).click();

    await expect(warnings).toHaveCount(0);

    await page.getByRole('button', {name: 'Actions menu'}).click();
    await page.getByRole('menuitem', {name: 'Run automatically'}).click();

    await expect(warnings).toHaveCount(2);
});

test('"Check spelling" shows error toast when no dictionary is available (authoring-react)', async ({page}) => {
    await restoreDatabaseSnapshot();
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    // Wait for editor3 to mount; spellchecker init will leave isActiveDictionary=false
    // because the default snapshot has no dictionary configured for the article language.
    await page.waitForTimeout(3000);

    await page.getByRole('button', {name: 'Actions menu'}).click();
    await page.getByText('Check spelling', {exact: true}).click();

    await expect(
        page.locator(s('notifications', 'notification--error'))
            .getByText('No dictionary available for spell checking.'),
    ).toBeVisible();
});
