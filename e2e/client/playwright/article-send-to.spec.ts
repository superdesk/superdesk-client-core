import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('sending an article', async () => {
    test('sending an article to another desk', {
        annotation: [
            {type: 'confluence', description: '1308524834 complete'}, // 🤖 Send item to another desk (AUTOMATED)
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
            'Edit',
        );

        await authoring.sendTo({desk: 'Education', stage: 'Working Stage'});

        await expect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        ).not.toBeVisible();
        await monitoring.selectDeskOrWorkspace('Education');
        await expect(
            page.locator(s('monitoring-group=Education / Working Stage', 'article-item=story 2')),
        ).toBeVisible();
    });

    test('sending an article to another stage of the same desk', {
        annotation: [
            {type: 'confluence', description: '1308524832 complete'}, // 🤖 Send item to another stage (AUTOMATED)
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        const currentDesk = 'Sports';

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace(currentDesk);

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
            'Edit',
        );

        await authoring.sendTo({desk: currentDesk, stage: 'Incoming Stage'});

        await expect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        ).not.toBeVisible();
        await expect(
            page.locator(s('monitoring-group=Sports / Incoming Stage', 'article-item=story 2')),
        ).toBeVisible();
    });

    test('sending an article with unsaved changes releases its lock', {
        annotation: [
            {type: 'jira', description: 'STT-1525'},
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const sportsItem = page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'))
            .getByTestId('article-item')
            .filter({hasText: 'story 2'});

        await monitoring.executeActionOnMonitoringItem(sportsItem, 'Edit');

        /**
         * The list exposes lock state only as a class. Asserting the indicator is present
         * while the item is open in the editor keeps the final not-locked assertion from
         * passing vacuously if that class is ever renamed.
         */
        await expect(sportsItem.locator('div.locked')).toHaveCount(1);

        await authoring.replaceEditor3FieldText(
            page.getByTestId('field--headline').getByRole('textbox'),
            'story 2 updated',
        );

        // the editor propagates changes to the scope with a debounce; sending before the
        // edit registers would skip the "Save changes?" prompt
        await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeEnabled();

        await authoring.sendTo({desk: 'Education', stage: 'Working Stage'});
        await page.getByTestId('modal-confirm').getByRole('button', {name: 'save and send'}).click();

        await expect(sportsItem).not.toBeVisible();

        await monitoring.selectDeskOrWorkspace('Education');

        const educationItem = page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Education / Working Stage"]'))
            .getByTestId('article-item')
            .filter({hasText: 'story 2 updated'});

        await expect(educationItem).toBeVisible();
        await expect(educationItem.locator('div.locked')).toHaveCount(0);
    });
});

test('only members can switch to a desk', async ({page}) => {
    await restoreDatabaseSnapshot();

    const deskName = 'Without members';

    await page.goto('/#/settings/desks');
    await expect(page.locator(s(`desk--${deskName}`))).toBeVisible();

    await page.goto('/#/workspace/monitoring');
    await page.locator(s('monitoring--selected-desk')).click();

    await expect(
        page.locator(`${s('monitoring--select-desk-options')} button`, {hasText: 'Sport'}),
    ).toBeVisible();

    await expect(
        page.locator(`${s('monitoring--select-desk-options')} button`, {hasText: deskName}),
    ).not.toBeVisible();
});
