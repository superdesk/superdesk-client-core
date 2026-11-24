import {test, expect} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

/**
 * QA cases "Correct item" and "Corrections workflow" on authoring-react. "Story 5" is the item
 * `main` ships published in Sports desk output.
 */

test.setTimeout(60000);

const SPORTS_OUTPUT = 'Sports desk output';

test.describe('correcting a published item', () => {
    test.use({storageState: getStorageState({}, {authoringReact: true})});

    test('sends a correction with an edited headline to the desk output and the publish queue', {
        annotation: [
            {type: 'confluence', description: '1310851139 complete'}, // Correct item
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new AuthoringReact(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await expect(monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'Story 5')).toBeVisible();
        await expect(monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'Story 5.1')).toHaveCount(0);

        await monitoring.executeActionOnMonitoringItem(
            monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'Story 5'),
            'Publishing actions',
            'Correct item',
        );
        await authoring.waitUntilOpen();

        await setEditor3FieldValue(authoring.input('headline'), 'Story 5.1');
        await authoring.root.getByTestId('send-correction').click();

        await expect(authoring.root).toBeHidden();

        const corrected = monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'Story 5.1');

        await expect(corrected).toBeVisible();
        await expect(corrected.getByText('Corrected', {exact: true})).toBeVisible();

        await page.goto('/#/publish_queue');
        await expect(
            page.getByTestId('publish-queue-item').and(page.locator('[data-test-value="Story 5.1"]')),
        ).toBeVisible();
    });
});

test.describe('corrections workflow', () => {
    test.use({storageState: getStorageState({corrections_workflow: true}, {authoringReact: true})});

    test('moves the item to the working stage as a correction, then sends it back corrected', {
        annotation: [
            {type: 'confluence', description: '1344443358 partial'}, // Corrections workflow
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new AuthoringReact(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const inWorkingStage = monitoring.getGroupedArticleLocator('Sports / Working Stage', 'Story 5');

        await expect(monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'Story 5')).toBeVisible();
        await expect(inWorkingStage).toHaveCount(0);

        await monitoring.executeActionOnMonitoringItem(
            monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'Story 5'),
            'Publishing actions',
            'Correct item',
        );

        await expect(inWorkingStage).toBeVisible();
        await expect(inWorkingStage.getByText('Correction', {exact: true})).toBeVisible();

        await authoring.waitUntilOpen();
        await setEditor3FieldValue(authoring.input('headline'), 'Story 5.1');
        await authoring.saveAndGetRequest();

        const panel = await authoring.openActionsPanel();

        await panel.getByTestId('publish').click();

        await expect(authoring.root).toBeHidden();

        const corrected = monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'Story 5.1');

        await expect(corrected).toBeVisible();
        await expect(corrected.getByText('Corrected', {exact: true})).toBeVisible();
        await expect(corrected.getByText('Correction', {exact: true})).toHaveCount(0);

        await page.goto('/#/publish_queue');
        await expect(
            page.getByTestId('publish-queue-item').and(page.locator('[data-test-value="Story 5.1"]')),
        ).toBeVisible();
    });
});
