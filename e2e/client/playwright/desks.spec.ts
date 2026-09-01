import {test, expect, Page} from '@playwright/test';
import {login, restoreDatabaseSnapshot, s, withTestContext} from './utils';
import {Monitoring} from './page-object-models/monitoring';

test('adding a desk', {
    annotation: [
        {type: 'confluence', description: '1311834267 partial'}, // Add new desk (AUTOMATED)
        {type: 'confluence', description: '1344443818 complete'}, // Desks and stages
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/desks');

    await page.locator(s('add-new-desk')).click();

    await withTestContext('desk-config-modal', async ({cs}) => {
        await page.locator(cs('field--name')).fill('desk 7');
        await page.locator(cs('field--source')).fill('from desk 7');
        await page.locator(cs('field--default-content-template')).selectOption('story 2');
        await page.locator(cs('field--default-content-profile')).selectOption('Story');
        await page.locator(cs('field--desk-type')).selectOption('production');
        await page.locator(cs('done')).click();
    });

    await expect(page.locator(s('desk--desk 7'))).toBeVisible();
});

test('deleting a desk', {
    annotation: [
        {type: 'confluence', description: '1311834334 complete'}, // Deleting desk (AUTOMATED)
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/desks');

    const deskName = 'Without members';

    await page.locator(`[data-test-id="desk--${deskName}"] [data-test-id="desk-actions"]`).click();
    await page.locator(`[data-test-id="desk--${deskName}"] [data-test-id="desk-actions--remove"]`).click();
    await page.locator('[data-test-id="modal-confirm"]').getByRole('button', {name: 'OK'}).click();
    await expect(page.locator(`[data-test-id="desk--${deskName}"]`)).not.toBeVisible();
});

test('desk deletion being blocked if desk has published articles', async ({page}) => {
    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/desks');

    await page.locator('[data-test-id="desk--Finance"] [data-test-id="desk-actions"]').click();
    await page.locator('[data-test-id="desk--Finance"] [data-test-id="desk-actions--remove"]').click();
    await page.locator('[data-test-id="modal-confirm"]').getByRole('button', {name: 'OK'}).click();
    await expect(page.getByText(
        'Error: Cannot delete desk as it has article(s) or referenced by versions of the article(s).',
    )).toBeVisible();

    await page.reload();

    await expect(page.locator('[data-test-id="desk--Finance"]')).toBeVisible({timeout: 5000});
});


test('desk deletion being blocked if a user has it assigned as default desk', async ({page}) => {
    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/desks');

    await page.locator('[data-test-id="desk--Sports"] [data-test-id="desk-actions"]').click();
    await page.locator('[data-test-id="desk--Sports"] [data-test-id="desk-actions--remove"]').click();
    await page.locator('[data-test-id="modal-confirm"]').getByRole('button', {name: 'OK'}).click();
    await expect(page.getByText(
        'Error: Cannot delete desk as it is assigned as default desk to user(s).',
    )).toBeVisible();

    await page.reload();

    await expect(page.locator('[data-test-id="desk--Sports"]')).toBeVisible({timeout: 5000});
});

/**
 * when a desk is mentioned in article comments,
 * a notification must show up next to an incoming stage of that desk
 */
test('desk notifications', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');
    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(
        s('authoring-widget=Comments'),
    ).click();

    await page.locator(
        s('comments-widget', 'new-comment-input'),
    ).fill('#Sports hello');

    await page.locator(
        s('comments-widget', 'new-comment-submit'),
    ).click();

    await expect(
        page.locator(
            s('monitoring-group=Sports / Incoming Stage', 'desk-notifications'),
        ),
    ).toContainText('1');
});

test('can mark/unmark for desk', {
    annotation: [
        {type: 'confluence', description: '1315931720 complete'}, // Unmark item from desk (AUTOMATED)
        {type: 'confluence', description: '1311835247 partial'}, // Mark article for desk from the list view (AUTOMATED)
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
        'Mark for desk',
        'Finance',
    );

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story', 'mark-for-desk--bell'),
    ).click();

    await expect(page.locator(s('marked-desk-list'))).toContainText('Finance');

    // unmark from a desk
    await page.locator(s(
        'monitoring-group=Sports / Working Stage',
        'article-item=test sports story',
        'mark-for-desk--bell',
    )).click();

    await page.locator(s('marked-desk-list')).getByRole('button', {name: 'remove'}).click();

    await expect(
        page.locator(s(
            'monitoring-group=Sports / Working Stage',
            'article-item=test sports story',
            'mark-for-desk--bell',
        )),
    ).not.toBeVisible();
});

test('Switching between desks', {
    annotation: [
        {type: 'confluence', description: '1344443825 complete'}, // Desk switching (AUTOMATED)
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await expect(page.locator(s('monitoring-view', 'article-item=test sports story'))).toBeVisible();
    await expect(page.locator(s('monitoring-view', 'article-item=Finances Story'))).not.toBeVisible();
    await page.goto('/#/workspace/spike-monitoring');
    await expect(page.locator(s('monitoring-view', 'article-item=Story 4'))).toBeVisible();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Finance');

    await expect(page.locator(s('monitoring-view', 'article-item=test sports story'))).not.toBeVisible();
    await expect(page.locator(s('monitoring-view', 'article-item=Finances Story'))).toBeVisible();
    await page.goto('/#/workspace/spike-monitoring');
    await expect(page.locator(s('monitoring-view', 'article-item=Story 4'))).not.toBeVisible();
});

// The remaining scenarios use the `legacy` snapshot (which has `Politic Desk`,
// the `testing` content template / profile, and the `populate_abstract` /
// `Validate for Publish` macros). The Playwright storageState targets the
// `main` user database, so override it and log in fresh.
//
// Run serially so that snapshot restoration and modal-state changes do not
// race against each other (a single backend serves every parallel worktree).
test.describe('desks - legacy snapshot', () => {
    test.describe.configure({mode: 'serial'});
    test.use({storageState: {cookies: [], origins: []}});

    async function openDesksSettings(page: Page): Promise<void> {
        await page.goto('/#/settings/desks');
        // wait for the desk grid to render before any further interaction —
        // navigating right after `login(page)` can race with a transient
        // login-modal overlay that intercepts clicks.
        await expect(page.locator(s('add-new-desk'))).toBeVisible();
        await expect(page.locator('[sd-login-modal].login-screen')).toBeHidden();
    }

    async function openDeskEdit(page: Page, deskName: string): Promise<void> {
        const row = page.locator(`[data-test-id="desk--${deskName}"]`);

        // Defend against snapshot races: if another agent restored `main`
        // between our `legacy` restore and this page load, `Politic Desk`
        // won't be present. Re-restore and reload up to two more times.
        for (let attempt = 0; attempt < 3; attempt++) {
            if (await row.count() > 0) {
                break;
            }
            await restoreDatabaseSnapshot({snapshotName: 'legacy'});
            await page.reload();
            await expect(page.locator(s('add-new-desk'))).toBeVisible();
        }

        await expect(row).toBeVisible();
        await row.locator(s('desk-actions')).click();
        await row.locator(s('desk-actions--options'))
            .getByRole('button', {name: 'Edit'})
            .click();
        await expect(page.locator('[data-test-id="desk-config-modal"]')).toBeVisible();
    }

    async function closeDeskModal(page: Page): Promise<void> {
        await page.locator('[data-test-id="desk-config-modal"] .close-modal').click();
        await expect(page.locator('[data-test-id="desk-config-modal"]')).not.toBeVisible();
    }

    async function showTab(page: Page, tabTitle: string): Promise<void> {
        await page.locator('[data-test-id="desk-config-modal"]')
            .locator('[sd-wizard] .nav-tabs')
            .getByRole('button', {name: tabTitle, exact: true})
            .click();
    }

    async function setContentExpiry(page: Page, hours: number, minutes: number): Promise<void> {
        // The sd-content-expiry directive renders the hours / minutes inputs
        // only when the expire toggle is ON. The toggle is the `sd-switch`
        // before the `<label>` containing the directive header.
        const expiryRow = page.locator('[sd-content-expiry]').filter({hasText: 'Content Expiry'});
        const hoursInput = expiryRow.locator('input[ng-model="contentExpiry.hours"]');

        if (await hoursInput.count() === 0) {
            await expiryRow.locator('[sd-switch]').first().click();
        }

        await hoursInput.fill(String(hours));
        await expiryRow.locator('input[ng-model="contentExpiry.minutes"]').fill(String(minutes));
    }

    test('edit desk', {
        annotation: [
            {type: 'confluence', description: '1311834275 complete'}, // Edit general desk settings
            {type: 'confluence', description: '1311834273 partial'}, // Edit stage
            {type: 'confluence', description: '1335329041 complete'}, // Remove stage
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'legacy'});
        await login(page);
        await openDesksSettings(page);
        await openDeskEdit(page, 'Politic Desk');

        // Use a per-run nonce so the diff watcher (`saveEnabled`) flips even
        // if the legacy snapshot already carries the values from a previous
        // run that polluted the shared backend.
        const nonce = Date.now().toString();
        const description = `New Description ${nonce}`;
        const source = `Test ${nonce}`;

        await withTestContext('desk-config-modal', async ({cs}) => {
            await page.locator(cs('field--description')).fill(description);
            await page.locator(cs('field--source')).fill(source);
            await page.locator(cs('field--desk-type')).selectOption('production');
            await setContentExpiry(page, 1, 10);
            await page.locator(cs('field--default-content-template')).selectOption({label: 'testing'});
            await page.locator(cs('field--default-content-profile')).selectOption({label: 'testing'});
            await expect(page.locator(cs('save-and-continue'))).toBeEnabled();
            await page.locator(cs('save-and-continue')).click();
        });

        await showTab(page, 'Macros');
        await page.locator('#save').click();

        // re-open the desk and verify the persisted values
        await openDeskEdit(page, 'Politic Desk');
        await withTestContext('desk-config-modal', async ({cs}) => {
            await expect(page.locator(cs('field--description'))).toHaveValue(description);
            await expect(page.locator(cs('field--source'))).toHaveValue(source);
            await expect(page.locator(cs('field--desk-type'))).toHaveValue('production');
            await expect(
                page.locator('[sd-content-expiry] input[ng-model="contentExpiry.hours"]'),
            ).toHaveValue('1');
            await expect(
                page.locator('[sd-content-expiry] input[ng-model="contentExpiry.minutes"]'),
            ).toHaveValue('10');
        });

        // stage management — switch to the Stages tab directly. Save &
        // Continue is disabled here because nothing has been edited since
        // re-opening the desk, but the tab itself is navigable.
        await showTab(page, 'Stages');
        await expect(page.locator('#new-stage')).toBeVisible();

        await page.locator('#new-stage').click();
        await page.locator('#insert-stage').fill('Test Stage');
        await page.locator('textarea[ng-model="editStage.description"]').fill('Test Stage Description');
        await page.locator('[sd-switch][ng-model="editStage.working_stage"]').click();
        await page.locator('#save-new-stage').click();

        // both working stages should now be deletable (the trash icon
        // appears once a stage no longer holds the sole working flag)
        const workingStageRow = page.locator('li').filter({
            has: page.locator('[data-test-id="stage-name"]', {hasText: 'Working Stage'}),
        });

        await workingStageRow.click();
        await expect(workingStageRow.locator('.icon-trash')).toBeVisible();

        // trying to remove the working-stage flag from the only remaining
        // working stage should error out
        const testStageRow = page.locator('li').filter({
            has: page.locator('[data-test-id="stage-name"]', {hasText: 'Test Stage'}),
        });

        await testStageRow.click();
        await testStageRow.locator('.icon-pencil').click();
        await page.locator('[sd-switch][ng-model="editStage.working_stage"]').click();
        await page.locator('#save-edited-stage').click();
        await expect(
            page.getByText('Must have one working stage'),
        ).toBeVisible();

        // Turning Incoming ON should turn Global Read ON automatically and
        // prevent it from being toggled back OFF.
        await testStageRow.click();
        await testStageRow.locator('.icon-pencil').click();

        const globalReadSwitch = page.locator('[sd-switch][ng-model="editStage.is_visible"]');
        const incomingSwitch = page.locator('[sd-switch][ng-model="editStage.default_incoming"]');

        await expect(globalReadSwitch).toHaveClass(/checked/);

        // toggle global-read OFF, then verify incoming is OFF and global-read
        // is no longer marked `prevent-off`
        await globalReadSwitch.click();
        await expect(globalReadSwitch).not.toHaveClass(/checked/);
        await expect(incomingSwitch).not.toHaveClass(/checked/);
        await expect(globalReadSwitch).not.toHaveClass(/prevent-off/);

        // turning incoming ON should flip global-read back ON and mark it
        // `prevent-off`
        await incomingSwitch.click();
        await expect(globalReadSwitch).toHaveClass(/checked/);
        await expect(globalReadSwitch).toHaveClass(/prevent-off/);

        await page.locator('[data-test-id="desk-config-modal"]')
            .getByRole('button', {name: 'Cancel'})
            .click();
        await closeDeskModal(page);
    });

    test('can set stage macro for new desk', {
        annotation: [
            {type: 'confluence', description: '1311834271 partial'}, // Create new stage
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'legacy'});
        await login(page);
        await openDesksSettings(page);

        // unique desk name to avoid collisions with prior runs on a shared
        // backend (other agents may have left a `Test Desk A` behind).
        const deskName = `Test Desk A ${Date.now()}`;

        await page.locator(s('add-new-desk')).click();

        await withTestContext('desk-config-modal', async ({cs}) => {
            await page.locator(cs('field--name')).fill(deskName);
            await page.locator(cs('field--source')).fill('Test Source A');
            await page.locator(cs('field--desk-type')).selectOption('authoring');
            await page.locator(cs('field--default-content-template')).selectOption({label: 'testing'});
            await page.locator(cs('field--default-content-profile')).selectOption({label: 'testing'});
            await expect(page.locator(cs('save-and-continue'))).toBeEnabled();
            await page.locator(cs('save-and-continue')).click();
        });

        await expect(page.locator('#new-stage')).toBeVisible();
        await page.locator('#new-stage').click();
        await page.locator('#insert-stage').fill('Test Stage A');
        await page.locator('textarea[ng-model="editStage.description"]')
            .fill('Test Desk A Stage A Description');

        // wait for macros to populate the three pickers
        const incomingMacro = page.locator('select[ng-model="editStage.incoming_macro"]');
        const onstageMacro = page.locator('select[ng-model="editStage.onstage_macro"]');
        const outgoingMacro = page.locator('select[ng-model="editStage.outgoing_macro"]');

        await expect.poll(
            async () => incomingMacro.locator('option').count(),
            {timeout: 10000},
        ).toBeGreaterThan(1);

        await incomingMacro.selectOption('populate_abstract');
        await onstageMacro.selectOption('Validate for Publish');
        await outgoingMacro.selectOption('populate_abstract');

        await page.locator('#save-new-stage').click();

        await page.locator('#next-stages').click();
        await showTab(page, 'Macros');
        await page.locator('#save').click();

        await openDeskEdit(page, deskName);
        await showTab(page, 'Stages');

        const testStageRow = page.locator('li').filter({
            has: page.locator('[data-test-id="stage-name"]', {hasText: 'Test Stage A'}),
        });

        await testStageRow.click();
        await testStageRow.locator('.icon-pencil').click();

        await expect(page.locator('select[ng-model="editStage.incoming_macro"]'))
            .toHaveValue('populate_abstract');
        await expect(page.locator('select[ng-model="editStage.onstage_macro"]'))
            .toHaveValue('Validate for Publish');
        await expect(page.locator('select[ng-model="editStage.outgoing_macro"]'))
            .toHaveValue('populate_abstract');

        await page.locator('[data-test-id="desk-config-modal"]')
            .getByRole('button', {name: 'Cancel'})
            .click();
        await closeDeskModal(page);
    });

    test('can enforce incoming, outgoing and onstage rules', {
        annotation: [
            {type: 'confluence', description: '1311834259 partial'}, // Assign user to a desk
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const deskName = `Rule Desk ${Date.now()}`;

        await restoreDatabaseSnapshot({snapshotName: 'legacy'});
        await login(page);

        // 1. Create a desk with three macro-bearing stages.
        await openDesksSettings(page);
        await page.locator(s('add-new-desk')).click();

        await withTestContext('desk-config-modal', async ({cs}) => {
            await page.locator(cs('field--name')).fill(deskName);
            await page.locator(cs('field--source')).fill('Rule Source');
            await page.locator(cs('field--desk-type')).selectOption('authoring');
            await page.locator(cs('field--default-content-template')).selectOption({label: 'testing'});
            await page.locator(cs('field--default-content-profile')).selectOption({label: 'testing'});
            await expect(page.locator(cs('save-and-continue'))).toBeEnabled();
            await page.locator(cs('save-and-continue')).click();
        });

        await expect(page.locator('#new-stage')).toBeVisible();

        async function addStage(
            stageName: string,
            slot: 'incoming_macro' | 'onstage_macro' | 'outgoing_macro',
            macroName: string,
        ): Promise<void> {
            await page.locator('#new-stage').click();
            await page.locator('#insert-stage').fill(stageName);

            const select = page.locator(`select[ng-model="editStage.${slot}"]`);

            await expect.poll(
                async () => select.locator('option').count(),
                {timeout: 10000},
            ).toBeGreaterThan(1);
            await select.selectOption(macroName);
            await page.locator('#save-new-stage').click();
        }

        await addStage('Test Stage A', 'incoming_macro', 'Validate for Publish');
        await addStage('Test Stage B', 'outgoing_macro', 'Validate for Publish');
        await addStage('Test Stage C', 'onstage_macro', 'Validate for Publish');

        // Add admin to People — otherwise the new desk is invisible in the
        // logged-in user's monitoring desk picker. The user assignment is
        // only persisted on save() via #next-people / #done-people; jumping
        // to another tab discards it.
        await page.locator('#next-stages').click();
        await page.locator(s('select-user--input')).fill('admin');
        await page.locator('[data-test-id^="select-user--option-"]').first().click();
        await page.locator('#done-people').click();
        await expect(page.locator('[data-test-id="desk-config-modal"]')).not.toBeVisible();

        // 2. Mark Subject + Body HTML required on the `testing` profile.
        await page.goto('/#/settings/content-profiles');
        await page.locator(s('content-profile=testing', 'content-profile-actions')).click();
        await page.locator(s('content-profile-actions--options'))
            .getByRole('button', {name: 'Edit'}).click();

        const editModal = page.locator(s('content-profile-editing-modal'));

        async function setFieldRequired(tabName: string, fieldLabel: string): Promise<void> {
            await editModal.locator(s('content-profile-tabs'))
                .getByRole('tab', {name: tabName}).click();
            await editModal.locator(s('content-profile-fields', `field=${fieldLabel}`)).click();

            const fieldEdit = page.locator(s('item-view-edit'));

            await fieldEdit.getByText('Required', {exact: true}).click();
            await fieldEdit.locator(s('item-view-edit--save')).click();
        }

        await setFieldRequired('Header fields', 'Subject');
        await setFieldRequired('Content fields', 'Body HTML');

        await editModal.getByRole('button', {name: 'Save'}).click();
        await expect(editModal).not.toBeVisible();

        // 3. Create an article from the testing template on the new desk.
        // Reload first — the monitoring desk picker caches the list.
        await page.goto('/#/workspace/monitoring');
        await page.reload();
        await monitoring.selectDeskOrWorkspace(deskName);
        await monitoring.createArticleFromTemplate('testing', {slugline: 'macro rule probe'});
        await page.locator(s('authoring-topbar', 'save')).click();
        await expect(page.locator(s('authoring-topbar', 'save'))).toBeDisabled();

        const workingStage = page.locator(s(`monitoring-group=${deskName} / Working Stage`));
        const stageA = page.locator(s(`monitoring-group=${deskName} / Test Stage A`));
        const stageB = page.locator(s(`monitoring-group=${deskName} / Test Stage B`));
        const stageC = page.locator(s(`monitoring-group=${deskName} / Test Stage C`));

        await expect(workingStage.locator(s('article-item'))).toHaveCount(1);

        async function sendToStage(stageName: string): Promise<void> {
            await page.locator(s('authoring-topbar', 'open-send-publish-pane')).click();
            await page.locator(s('interactive-actions-panel', 'tabs'))
                .getByRole('tab', {name: 'Send to'}).click();
            // Radio inputs are visually hidden behind sd-check-button labels.
            // check({force: true}) clicks the input directly.
            await page.locator(s('interactive-actions-panel', 'stage-select'))
                .getByRole('radio', {name: stageName}).check({force: true});
            await page.locator(s('interactive-actions-panel', 'send')).click();
        }

        async function expectMacroToast(rule: 'incoming' | 'onstage' | 'outgoing', stage: string): Promise<void> {
            const toast = page.locator('[data-test-id^="notification--error"]')
                .filter({hasText: `${rule} rule:Validate for Publish for stage:${stage}`});

            await expect(toast.first()).toBeVisible({timeout: 10000});
        }

        // 4a. incoming rule on Test Stage A.
        await monitoring.executeActionOnMonitoringItem(
            workingStage.locator(s('article-item')).first(), 'Edit');
        await sendToStage('Test Stage A');
        await expectMacroToast('incoming', 'Test Stage A');
        await expect(stageA.locator(s('article-item'))).toHaveCount(0);
        // Close the lingering Send-to panel (the macro toast leaves it open
        // intercepting topbar clicks), then close authoring.
        await page.locator('sd-interactive-article-actions-panel-combined .icon-close-small').click();
        await page.locator(s('authoring-topbar', 'close')).click();

        // 4b. onstage rule on Test Stage C (macro fires AFTER the move, so
        // the item ends up on Stage C with a toast).
        await monitoring.executeActionOnMonitoringItem(
            workingStage.locator(s('article-item')).first(), 'Edit');
        await sendToStage('Test Stage C');
        await expectMacroToast('onstage', 'Test Stage C');
        await expect(stageC.locator(s('article-item'))).toHaveCount(1);
        // Close the lingering Send-to panel (the macro toast leaves it open
        // intercepting topbar clicks), then close authoring.
        await page.locator('sd-interactive-article-actions-panel-combined .icon-close-small').click();
        await page.locator(s('authoring-topbar', 'close')).click();

        // 4c. outgoing rule on Test Stage B (move C → B succeeds, then B → A
        // triggers B's outgoing macro and is blocked).
        await monitoring.executeActionOnMonitoringItem(
            stageC.locator(s('article-item')).first(), 'Edit');
        await sendToStage('Test Stage B');
        await expect(stageB.locator(s('article-item'))).toHaveCount(1);

        await monitoring.executeActionOnMonitoringItem(
            stageB.locator(s('article-item')).first(), 'Edit');
        await sendToStage('Test Stage A');
        await expectMacroToast('outgoing', 'Test Stage B');
        await expect(stageB.locator(s('article-item'))).toHaveCount(1);
        await expect(stageA.locator(s('article-item'))).toHaveCount(0);
    });
});
