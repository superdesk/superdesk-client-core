import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {login, restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Lock item".
 *
 * While an article is open for editing, every other session sees it locked: a red
 * stripe in the monitoring list, a 3-dot menu that offers "Open"/"Open in new Window"
 * but no "Edit", and a read-only authoring view carrying the lock owner and an
 * Unlock button but no Save.
 *
 * The documented case reaches that state with a second *user*. The `main` snapshot
 * has only one user assigned to a desk, and the client gates all of this on the
 * *session* rather than the user (`LockService.isLocked` compares the item's
 * `lock_session` against the current session id), so a second logged-in session of
 * the same user reproduces the case. What that workaround cannot reach is the
 * documented "Unlock button shown/hidden with the unlock privilege" branch:
 * `LockService.can_unlock` returns true immediately when `isLockedByMe(item)` is
 * true, and `isLockedByMe` compares the item's `lock_user` against the current
 * *user* id, so while both sessions belong to the same user the observer always
 * sees Unlock, whatever privileges it holds. Covering either side of that branch
 * needs a second desk-member user in the snapshot; logging the observing session
 * in as a lower-privileged user would not help on its own.
 */
test.describe('locking an item that is open for editing', {
    annotation: [
        {type: 'confluence', description: '1308524847 partial'}, // Lock item
    ],
}, () => {
    const ARTICLE = 'test sports story';

    test('another session gets it read-only, without an Edit action and without Save', async ({page, browser}) => {
        await restoreDatabaseSnapshot();

        /*
         * browser.newContext() inherits the committed storageState from the config,
         * which would put both pages in the same Superdesk session and so leave the
         * item unlocked for the observer. `storageState: undefined` forces a clean
         * context that authenticates into a session of its own.
         */
        const lockOwnerContext = await browser.newContext({storageState: undefined});

        try {
            const lockOwnerPage = await lockOwnerContext.newPage();

            await login(lockOwnerPage);
            await lockOwnerPage.goto('/#/workspace/monitoring');

            const lockOwnerMonitoring = new Monitoring(lockOwnerPage);

            await lockOwnerMonitoring.selectDeskOrWorkspace('Sports');

            const lockOwnerItem = lockOwnerMonitoring.getArticleLocator(ARTICLE);

            // Wait for the list to populate (the post-restore reindex empties it briefly)
            // so the double click does not race the rebuild.
            await expect(lockOwnerItem).toBeVisible();

            await lockOwnerItem.dblclick();

            // Save proves the item opened for editing rather than read-only.
            await expect(lockOwnerPage.getByTestId('authoring-topbar').getByTestId('save')).toBeVisible();

            // `article-item-locked` marks the red-striped list item, in the lock owner's list too.
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

            // Fields render with their values, and every editable surface is inert:
            // editor3 fields drop to contenteditable="false", plain inputs are disabled.
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
            // Unlock is offered because the lock owner is the same user, not because of the
            // unlock privilege, so this asserts presence only (see the note at the top).
            await expect(lockedInfo.getByTestId('unlock')).toBeVisible();

            await topbar.getByTestId('close').click();
            await expect(authoring).toHaveCount(0);

            // Double clicking a locked item reopens it read-only rather than for editing.
            await item.dblclick();
            await expect(authoring).toBeVisible();
            await expect(topbar.getByTestId('locked-info')).toBeVisible();
            await expect(topbar.getByTestId('save')).toHaveCount(0);
        } finally {
            /*
             * A failed assertion must not leave a second live Superdesk session behind:
             * its open authoring page keeps autosaving into the database that the next
             * spec's restoreDatabaseSnapshot() has just rewritten.
             */
            await lockOwnerContext.close();
        }
    });
});
