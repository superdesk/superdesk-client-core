import {Browser, BrowserContext, Locator, Page, expect, test} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Users} from './page-object-models/users';
import {UserRolesSettings} from './page-object-models/settings/user-roles';
import {loginAs, restoreDatabaseSnapshot} from './utils';

/**
 * QA cases about locked items: who may unlock one, and how the Unlock content
 * privilege is granted.
 *
 * The base "Lock item" case (1308524847) is covered by `lock-item.spec.ts` and
 * is not repeated here. That spec could not reach the privilege branch of the
 * lock UI, because it observes with a second session of the same user and
 * `LockService.can_unlock` short-circuits to true on `isLockedByMe`. These tests
 * close that gap with the second-actor users the `main` snapshot now carries.
 *
 * Product wording that diverges from the cases, asserted as the product renders it:
 *
 * - Both privilege cases quote the toast as "Privileges updated"; the product
 *   notifies "Privileges updated." with a full stop.
 * - Case 1311834225 quotes one message, "Item Unlocked: Item <headline> was
 *   unlocked by <User2>". The product splits it into a dialog title
 *   ("Item Unlocked") and a body ("Item <headline> was unlocked by <username>.").
 * - Case 1311834225 has the observer click the lock owner's avatar to reveal the
 *   lock owner and the Unlock button. The authoring topbar renders that whole
 *   block (`locked-info`) inline, so there is nothing to click open.
 *
 * The negative half of the privilege gate uses `samgamgee` before the grant
 * rather than the privilege-free `frodobaggins`: the monitoring route is
 * registered with `privileges: {monitoring_view: 1}`
 * (`scripts/apps/monitoring/config.ts`), so an account holding nothing cannot
 * reach the item at all. Using the same account either side of the grant also
 * makes the two positive tests harder to pass for the wrong reason.
 *
 * Parked: the seven publishing/correcting cases in this batch (1328906265,
 * 1328906267, 1328906291, 1328906297, 1328906307, 1328906312, 1328906320).
 *
 * Every one of them lists `PUBLISH_ASSOCIATIONS=true` as a prerequisite. The
 * setting is called `PUBLISH_ASSOCIATED_ITEMS` in superdesk-core, it defaults to
 * `False` in `superdesk/default_settings.py`, and `e2e/server/settings.py` does
 * not override it. The only publish-time lock validation in the backend is the
 * block guarded by `if get_config(bool, "PUBLISH_ASSOCIATED_ITEMS")` inside
 * `_validate_associated_items` (`apps/publish/content/common.py`), which is what
 * emits "packaged item is locked by ...". With the flag off, publishing or
 * correcting an item whose association is locked simply succeeds, so neither the
 * error message nor the documented "publishing does not go thru" outcome exists
 * to assert. Turning the flag on is not a spec-level change: it lives in the e2e
 * server settings that this branch's fixture base owns, and it would also switch
 * off `_raise_if_unpublished_related_items` for the whole suite.
 *
 * The feature-media and gallery cases additionally claim that a locked item
 * cannot be added to those fields. Neither drop handler
 * (`RelatedItemsDirective`, `ItemAssociationDirective`) inspects the lock, so
 * that guard does not exist in this client either.
 */

// Two Superdesk sessions plus a snapshot restore do not fit the 30s default.
test.setTimeout(120000);

const ARTICLE = 'test sports story';
const LOCK_OWNER_NAME = 'John Doe';
const UNLOCK_PRIVILEGE = 'unlock';

/**
 * `samgamgee` holds the `Sub Editor` role, which grants `archive` but sets
 * `unlock` to 0. Both privileges are required: superdesk-core's
 * `ItemLock.can_unlock` calls `archive.can_edit` (which needs `archive`) and
 * then demands `archive` and `unlock` together. So this account is one granted
 * privilege away from being able to unlock, which is what the two granting
 * cases are about.
 */
const GRANTEE = {username: 'samgamgee', password: 'samgamgee', displayName: 'Sam Gamgee'};
const GRANTEE_ROLE = 'Sub Editor';

/**
 * Opens the article for editing in the admin session, which is what takes the
 * lock every other session then sees.
 */
async function lockArticleAsAdmin(page: Page): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const item = monitoring.getArticleLocator(ARTICLE);

    // Wait for the list to populate (the post-restore reindex empties it briefly)
    // so the double click does not race the rebuild.
    await expect(item).toBeVisible();

    await item.dblclick();

    // Save proves the item opened for editing rather than read-only.
    await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeVisible();

    // `article-item-locked` marks the red-striped list item, in the lock owner's list too.
    await expect(item.getByTestId('article-item-locked')).toHaveCount(1);
}

interface ISecondActorSession {
    context: BrowserContext;
    page: Page;
    topbar: Locator;
    lockedInfo: Locator;
}

/**
 * Logs a second user in and opens the locked article in its read-only authoring
 * view, leaving the caller to assert on the lock panel.
 *
 * `browser.newContext()` inherits the committed storageState from the config,
 * which would put both pages in the same Superdesk session and so leave the item
 * unlocked for the observer. `storageState: undefined` forces a clean context
 * that authenticates into a session of its own.
 */
async function openLockedArticleAs(
    browser: Browser,
    actor: {username: string; password: string},
): Promise<ISecondActorSession> {
    const context = await browser.newContext({storageState: undefined});
    const page = await context.newPage();

    await loginAs(page, actor.username, actor.password);

    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const item = monitoring.getArticleLocator(ARTICLE);

    await expect(item).toBeVisible();
    await expect(item.getByTestId('article-item-locked')).toHaveCount(1);

    await item.dblclick();

    const topbar = page.getByTestId('authoring-topbar');
    const lockedInfo = topbar.getByTestId('locked-info');

    await expect(page.getByTestId('authoring')).toBeVisible();
    await expect(lockedInfo).toBeVisible();

    // The avatar is wrapped in react-lazyload, so wait for it to render before
    // reading anything else out of the panel.
    await expect(lockedInfo.getByTestId('user-avatar')).toBeVisible();
    await expect(lockedInfo).toContainText(`Locked by ${LOCK_OWNER_NAME}`);
    await expect(topbar.getByTestId('save')).toHaveCount(0);

    return {context, page, topbar, lockedInfo};
}

/**
 * Clicks Unlock and waits for the read-only view to turn into an editable one.
 *
 * `AuthoringDirective.unlock` releases the lock and immediately reopens the item
 * for editing, so the settled state is Save present and the lock panel gone.
 */
async function unlock(session: ISecondActorSession): Promise<void> {
    await session.lockedInfo.getByTestId('unlock').click();

    await expect(session.topbar.getByTestId('save')).toBeVisible();
    await expect(session.topbar.getByTestId('locked-info')).toHaveCount(0);
}

test.describe('unlocking an item locked by another user', () => {
    test('the Unlock content privilege granted to an individual user', {
        annotation: [
            {type: 'confluence', description: '1311834235 complete'}, // Grant Unlock content to individual user
            {type: 'confluence', description: '1311834225 complete'}, // Unlock item
        ],
    }, async ({page, browser}) => {
        await restoreDatabaseSnapshot();

        const users = new Users(page);

        await users.openList();
        await users.openFullProfile(GRANTEE.displayName);

        await page.getByTestId('page-sections')
            .getByTestId('page-section')
            .and(page.locator('[data-test-value="privileges"]'))
            .click();

        const privilegesForm = page.getByTestId('user-privileges-form');

        await expect(privilegesForm).toBeVisible();

        const actionBar = privilegesForm.getByTestId('action-bar');
        const unlockRow = privilegesForm.getByTestId('privilege-row')
            .and(page.locator(`[data-test-value="${UNLOCK_PRIVILEGE}"]`));
        const unlockCheckbox = unlockRow.getByTestId('privilege-checkbox');

        await expect(unlockRow).toContainText('Unlock content');
        await expect(unlockCheckbox).toHaveCount(1);
        await expect(unlockCheckbox).not.toBeChecked();

        /*
         * The action bar is always in the DOM. It is absolutely positioned
         * (`styles/sass/layouts.scss`) and parked above the pane at
         * `inset-block-start: -48px` until the `show` class slides it to 0
         * (`.user-details-pane .action-bar` in `scripts/apps/users/styles/users.scss`),
         * so it keeps a bounding box while hidden and toBeVisible() cannot tell the
         * two states apart. The class is the state.
         */
        await expect(actionBar).not.toHaveClass(/\bshow\b/);

        await unlockCheckbox.check();
        await expect(actionBar).toHaveClass(/\bshow\b/);
        await expect(actionBar.getByTestId('cancel')).toBeEnabled();
        await expect(actionBar.getByTestId('save')).toBeEnabled();

        await actionBar.getByTestId('cancel').click();
        await expect(unlockCheckbox).not.toBeChecked();
        await expect(actionBar).not.toHaveClass(/\bshow\b/);

        await unlockCheckbox.check();

        const [saveResponse] = await Promise.all([
            page.waitForResponse(
                (response) => response.url().includes('/api/users/') && response.request().method() === 'PATCH',
            ),
            actionBar.getByTestId('save').click(),
        ]);

        expect(saveResponse.status()).toBe(200);

        await expect(
            page.getByTestId('notification--success').filter({hasText: 'Privileges updated.'}),
        ).toBeVisible();
        await expect(actionBar).not.toHaveClass(/\bshow\b/);
        await expect(unlockCheckbox).toBeChecked();

        await lockArticleAsAdmin(page);

        const grantee = await openLockedArticleAs(browser, GRANTEE);

        try {
            await expect(grantee.lockedInfo.getByTestId('unlock')).toBeVisible();

            await unlock(grantee);

            const dialog = page.getByTestId('modal-confirm');

            await expect(dialog).toBeVisible();
            await expect(dialog).toContainText('Item Unlocked');
            await expect(dialog).toContainText(`Item ${ARTICLE} was unlocked by ${GRANTEE.displayName}.`);

            const okButton = dialog.getByRole('button', {name: 'OK', exact: true});

            await expect(okButton).toBeVisible();

            // modalService passes `false` as the cancel label, so OK is the only choice
            // offered next to the dialog's own close control.
            await expect(dialog.getByRole('button', {name: 'Cancel', exact: true})).toHaveCount(0);

            await okButton.click();
            await expect(dialog).toHaveCount(0);

            /*
             * Unlocking reopens the item for editing in the grantee's session, so the
             * lock owner shown to the admin flips to the grantee once the resulting
             * `item:lock` notification lands.
             */
            const adminLockedInfo = page.getByTestId('authoring-topbar').getByTestId('locked-info');

            await expect(adminLockedInfo).toBeVisible();
            await expect(adminLockedInfo.getByTestId('user-avatar')).toBeVisible();
            await expect(adminLockedInfo).toContainText(`Locked by ${GRANTEE.displayName}`);
        } finally {
            /*
             * A failed assertion must not leave a second live Superdesk session behind:
             * its open authoring page keeps autosaving into the database that the next
             * spec's restoreDatabaseSnapshot() has just rewritten.
             */
            await grantee.context.close();
        }
    });

    test('the Unlock content privilege granted through a user role', {
        annotation: [
            {type: 'confluence', description: '1311834233 complete'}, // Grant Unlock content via user role
        ],
    }, async ({page, browser}) => {
        await restoreDatabaseSnapshot();

        const userRoles = new UserRolesSettings(page);

        await userRoles.open();
        await userRoles.openPrivilegesTab();

        const saveButton = page.getByTestId('save-privileges');

        await expect(saveButton).toBeDisabled();

        // Also gates the table: the rows are only interpolated once /api/privileges lands.
        expect(await userRoles.getPrivilegeNames()).toContain(UNLOCK_PRIVILEGE);

        await expect(
            page.getByTestId('privilege-row').and(page.locator(`[data-test-value="${UNLOCK_PRIVILEGE}"]`)),
        ).toContainText('Unlock content');

        await expect(userRoles.getPrivilegeCheckbox(UNLOCK_PRIVILEGE, GRANTEE_ROLE)).not.toBeChecked();
        await userRoles.getPrivilegeCheckbox(UNLOCK_PRIVILEGE, GRANTEE_ROLE).check();
        await expect(saveButton).toBeEnabled();

        await page.goto('/#/workspace/monitoring');
        await expect(page.getByTestId('monitoring--selected-desk')).toBeVisible();

        await userRoles.open();
        await userRoles.openPrivilegesTab();
        await expect(userRoles.getPrivilegeCheckbox(UNLOCK_PRIVILEGE, GRANTEE_ROLE)).toBeVisible();
        await expect(userRoles.getPrivilegeCheckbox(UNLOCK_PRIVILEGE, GRANTEE_ROLE)).not.toBeChecked();

        await userRoles.getPrivilegeCheckbox(UNLOCK_PRIVILEGE, GRANTEE_ROLE).check();
        await userRoles.savePrivileges();

        await expect(
            page.getByTestId('notification--success').filter({hasText: 'Privileges updated.'}),
        ).toBeVisible();
        await expect(saveButton).toBeDisabled();
        await expect(userRoles.getPrivilegeCheckbox(UNLOCK_PRIVILEGE, GRANTEE_ROLE)).toBeChecked();

        // Reload to prove the grant was persisted server-side, not just held in scope.
        await userRoles.reload();
        await userRoles.openPrivilegesTab();
        await expect(userRoles.getPrivilegeCheckbox(UNLOCK_PRIVILEGE, GRANTEE_ROLE)).toBeChecked();

        await lockArticleAsAdmin(page);

        const grantee = await openLockedArticleAs(browser, GRANTEE);

        try {
            await expect(grantee.lockedInfo.getByTestId('unlock')).toBeVisible();

            await unlock(grantee);
        } finally {
            await grantee.context.close();
        }
    });

    test('a user whose role withholds the privilege is offered no Unlock button', {
        annotation: [
            {type: 'confluence', description: '1311834225 complete'}, // Unlock item
        ],
    }, async ({page, browser}) => {
        await restoreDatabaseSnapshot();

        await lockArticleAsAdmin(page);

        const observer = await openLockedArticleAs(browser, GRANTEE);

        try {
            const unlockButton = observer.lockedInfo.getByTestId('unlock');

            // ng-show only toggles `.ng-hide`, so the button stays in the DOM and a
            // count assertion would pass for the wrong reason.
            await expect(unlockButton).toHaveCount(1);
            await expect(unlockButton).toBeHidden();
        } finally {
            await observer.context.close();
        }
    });
});
