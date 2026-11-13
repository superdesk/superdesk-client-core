import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {login, restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Lock item", observed from a second session of the same user (the `main`
 * snapshot has only one desk member). The client gates locking on the session id, so
 * this reproduces the read-only view. It cannot cover the "Unlock shown/hidden by
 * privilege" branch: `LockService.can_unlock` short-circuits on `isLockedByMe`, which
 * compares user ids, so the observer always sees Unlock. That needs a second desk-member user.
 */
test.describe('locking an item that is open for editing', {
    annotation: [
        {type: 'confluence', description: '1308524847 partial'}, // Lock item
    ],
}, () => {
    const ARTICLE = 'test sports story';

    test('another session gets it read-only, without an Edit action and without Save', async ({page, browser}) => {
        await restoreDatabaseSnapshot();

        // newContext() inherits the config's storageState, which would share one Superdesk
        // session and leave the item unlocked for the observer; undefined forces a new session.
        const lockOwnerContext = await browser.newContext({storageState: undefined});

        try {
            const lockOwnerPage = await lockOwnerContext.newPage();

            await login(lockOwnerPage);
            await lockOwnerPage.goto('/#/workspace/monitoring');

            const lockOwnerMonitoring = new Monitoring(lockOwnerPage);

            await lockOwnerMonitoring.selectDeskOrWorkspace('Sports');

            const lockOwnerItem = lockOwnerMonitoring.getArticleLocator(ARTICLE);

            // The post-restore reindex briefly empties the list; wait so dblclick does not race it.
            await expect(lockOwnerItem).toBeVisible();

            await lockOwnerItem.dblclick();

            await expect(lockOwnerPage.getByTestId('authoring-topbar').getByTestId('save')).toBeVisible();

            await expect(lockOwnerItem.getByTestId('article-item-locked')).toHaveCount(1);

            const monitoring = new Monitoring(page);

            await page.goto('/#/workspace/monitoring');
            await monitoring.selectDeskOrWorkspace('Sports');

            const item = monitoring.getArticleLocator(ARTICLE);

            await expect(item).toBeVisible();
            await expect(item.getByTestId('article-item-locked')).toHaveCount(1);

            const actionsMenu = await monitoring.openArticleActionsMenu(item);

            await expect(actionsMenu.getByRole('button', {name: 'Open', exact: true})).toBeVisible();
            await expect(actionsMenu.getByRole('button', {name: 'Open in new Window', exact: true})).toBeVisible();
            await expect(actionsMenu.getByRole('button', {name: 'Edit', exact: true})).toHaveCount(0);

            await actionsMenu.getByRole('button', {name: 'Open', exact: true}).click();

            const authoring = page.getByTestId('authoring');
            const topbar = page.getByTestId('authoring-topbar');

            await expect(authoring).toBeVisible();

            const headline = authoring.getByTestId('field--headline');
            const body = authoring.getByTestId('authoring-field').and(page.locator('[data-test-value="body_html"]'));
            const slugline = authoring.getByTestId('field-slugline');

            await expect(headline).toContainText(ARTICLE);
            await expect(headline.getByTestId('editor3').locator('[contenteditable]'))
                .toHaveAttribute('contenteditable', 'false');

            await expect(body).toContainText('test sport story body');
            await expect(body.getByTestId('editor3').locator('[contenteditable]'))
                .toHaveAttribute('contenteditable', 'false');

            await expect(slugline).toHaveValue(ARTICLE);
            await expect(slugline).toBeDisabled();

            await expect(topbar.getByTestId('save')).toHaveCount(0);
            await expect(topbar.getByTestId('close')).toBeVisible();

            const lockedInfo = topbar.getByTestId('locked-info');

            await expect(lockedInfo).toBeVisible();
            await expect(lockedInfo.getByTestId('user-avatar')).toBeVisible();
            await expect(lockedInfo).toContainText('Locked by John Doe');
            // Presence only: Unlock shows because the owner is the same user (see header).
            await expect(lockedInfo.getByTestId('unlock')).toBeVisible();

            await topbar.getByTestId('close').click();
            await expect(authoring).toHaveCount(0);

            await item.dblclick();
            await expect(authoring).toBeVisible();
            await expect(topbar.getByTestId('locked-info')).toBeVisible();
            await expect(topbar.getByTestId('save')).toHaveCount(0);
        } finally {
            // Close even on failure: the open authoring page would keep autosaving into the
            // database the next spec restores.
            await lockOwnerContext.close();
        }
    });
});
