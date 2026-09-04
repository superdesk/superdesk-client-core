import {test, expect, Page, Locator} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({override_ednote_for_corrections: true}, {authoringReact: true}),
});

test.setTimeout(60000);

function getAuthoringField(page: Page, fieldId: string): Locator {
    return page.getByTestId('authoring')
        .getByTestId('authoring-field')
        .and(page.locator(`[data-test-value="${fieldId}"]`));
}

test('correcting a published item (authoring-react)', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator('Sports desk output', 'Story 5'),
        'Publishing actions',
        'Correct item',
    );

    await authoring.waitForAuthoringReactToInitialize();

    // `override_ednote_for_corrections` is enabled, so the correct flow must prefill the ednote
    await expect(getAuthoringField(page, 'ednote').getByRole('textbox'))
        .toContainText('This is a corrected repeat');

    await setEditor3FieldValue(getAuthoringField(page, 'headline').getByRole('textbox'), 'Story 5.1');

    await page.getByTestId('send-correction').click();

    const correctedItem = monitoring.getGroupedArticleLocator('Sports desk output', 'Story 5.1');

    await expect(correctedItem).toBeVisible();
    await expect(correctedItem.getByText('Corrected', {exact: true})).toBeVisible();
});

test('killing a published item (authoring-react)', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator('Sports desk output', 'Story 5'),
        'Publishing actions',
        'Kill item',
    );

    await authoring.waitForAuthoringReactToInitialize();

    await expect(getAuthoringField(page, 'headline').getByRole('textbox'))
        .toHaveText('Kill/Takedown notice');

    await page.getByTestId('send-kill').click();

    const killedItem = monitoring.getGroupedArticleLocator('Sports desk output', 'Kill/Takedown notice');

    await expect(killedItem).toBeVisible();
    await expect(killedItem.getByText('Killed', {exact: true})).toBeVisible();
});

test('taking down a published item (authoring-react)', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator('Sports desk output', 'Story 5'),
        'Publishing actions',
        'Takedown item',
    );

    await authoring.waitForAuthoringReactToInitialize();

    await expect(getAuthoringField(page, 'headline').getByRole('textbox'))
        .toHaveText('Takedown notice');

    await page.getByTestId('send-takedown').click();

    const takenDownItem = monitoring.getGroupedArticleLocator('Sports desk output', 'Takedown notice');

    await expect(takenDownItem).toBeVisible();
    await expect(takenDownItem.getByText('Recalled', {exact: true})).toBeVisible();
});
