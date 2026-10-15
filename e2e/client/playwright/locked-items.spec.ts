import {Browser, BrowserContext, Locator, Page, expect, test} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {Users} from './page-object-models/users';
import {UserRolesSettings} from './page-object-models/settings/user-roles';
import {loginAs, restoreDatabaseSnapshot} from './utils';
import {dropArticle} from './utils/drag-and-drop';

/**
 * QA cases about locked items: who may unlock one, how the Unlock content privilege
 * is granted, and what publishing does when an item's association is locked.
 *
 * The base "Lock item" case (1308524847) is covered by `lock-item.spec.ts` and
 * is not repeated here. That spec could not reach the privilege branch of the
 * lock UI, because it observes with a second session of the same user and
 * `LockService.can_unlock` short-circuits to true on `isLockedByMe`. These tests
 * close that gap with the second-actor users the `main` snapshot now carries.
 *
 * Product wording that diverges from the cases, asserted as the product renders it:
 *
 * - The privilege cases quote "Privileges updated"; the product adds a full stop.
 * - Case 1311834225 quotes one message ("Item Unlocked: Item <headline> was unlocked
 *   by <User2>"); the product splits it into a dialog title and body, and renders the
 *   Unlock button inline in the topbar's `locked-info` block rather than behind the
 *   avatar click the case describes.
 * - The publish/correct cases wrap the refusals in a heading ("The following items
 *   that you are trying to publish are locked:") and footer ("Unlock them first and
 *   then continue.") that exist nowhere in this client or in superdesk-core. What the
 *   product raises is one error notification per locked association: the backend's
 *   `_issues['validator exception']`, split up by `scripts/api/article.ts`.
 *
 * The refusal wording depends on the button, not on who holds the lock.
 * `_validate_associated_items` (`apps/publish/content/common.py`, active because
 * `e2e/server/settings.py` sets `PUBLISH_ASSOCIATED_ITEMS = True`) compares each
 * association's `lock_user` against the publishing item's own `lock_user`:
 *
 * - Publish routes through `$scope.beforeSend`, which unlocks the publishing item
 *   first, so publishes always get "<headline>: packaged item is locked by another
 *   user", even when the publisher holds the lock, which the package test takes the
 *   lock itself to pin down.
 * - Send Correction calls `$scope.publish()` directly and releases nothing, so the
 *   correction tests get "<headline>: packaged item is locked by you. Unlock it and
 *   try again", the half of case 1328906291 that asks for "locked by you".
 *
 * The negative half of the privilege gate uses `samgamgee` before the grant rather
 * than the privilege-free `frodobaggins`: the monitoring route requires
 * `monitoring_view` (`scripts/apps/monitoring/config.ts`), so an account holding
 * nothing cannot reach the item at all, and using one account either side of the
 * grant keeps the positive tests from passing for the wrong reason.
 *
 * The related-item and gallery cases run against the `association-fields` snapshot
 * ("Shire related items" and "Shire gallery" on the Story profile, plus the items to
 * drop into them; see `e2e/server/dump/records/README.md`), because `main` carries no
 * vocabulary with a `field_type` at all.
 *
 * Cases 1328906297, 1328906307 and 1328906320 stay `partial` over one shared result:
 * each claims the scenario works the same for an image uploaded from a folder as for
 * the drag driven here (the upload entry point belongs to case 1310851132). The
 * gallery pair also expects the field itself to refuse a locked item, which only the
 * publishing test drives.
 *
 * Still parked: 1328906312 (correcting a package) describes behaviour the product
 * does not have. A package keeps its members in `groups`, not `associations`, and
 * `_validate_associated_items` only checks `get_residrefs` on `ITEM_PUBLISH`, so a
 * correction of a package with a locked member is not refused.
 */

// Two Superdesk sessions plus a snapshot restore do not fit the 30s default, and the
// publishing tests add several lock and publish round trips on top of that.
test.setTimeout(180000);

const ARTICLE = 'test sports story';
const PICTURE = 'Rivendell picture';
const PACKAGE = 'Package Highlight 1';
const PACKAGED_STORY = 'Story 3';
const SPORTS_DESK_OUTPUT = 'Sports desk output';
const LOCK_OWNER_NAME = 'John Doe';
const UNLOCK_PRIVILEGE = 'unlock';

/**
 * The snapshot carrying the two association fields the related-item and gallery cases need,
 * plus the text and picture items to put in them. See `e2e/server/dump/records/README.md`.
 */
const ASSOCIATION_FIELDS = 'association-fields';

const GALLERY_FIELD = 'Shire gallery';
const RELATED_ITEMS = ['Bree bulletin', 'Rohan dispatch'];
const CORRECTION_RELATED_ITEM = 'Weathertop note';
const GALLERY_PICTURES = ['Gondor picture', 'Mirkwood picture'];
const CORRECTION_PICTURE = 'Fangorn picture';

/**
 * Clicking a notification that has already removed itself is an accepted outcome, so
 * the click is given just enough time to land rather than a full assertion budget.
 */
const NOTIFICATION_CLICK_TIMEOUT_MS = 2000;

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

    /*
     * The caller can only close this context once the session is handed back, so
     * anything that throws before the return has to close it here. Contexts made
     * from the `browser` fixture are not auto-closed until the worker ends, and a
     * leaked one means a live second Superdesk session autosaving through every
     * retry and every later spec in the run.
     */
    try {
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
    } catch (error) {
        await context.close();

        throw error;
    }
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

    // The topbar settles before the editable form paints; asserting a field proves the
    // reopen produced an editor rather than bare chrome over a blank pane.
    await expect(
        session.page.getByTestId('authoring').getByTestId('authoring-field').first(),
    ).toBeVisible();
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

    /*
     * Deliberately unannotated: this is the inverse of case 1311834225, whose
     * prerequisite is that the observing user holds Unlock content. The case
     * itself is covered by the first test.
     */
    test('a user whose role withholds the privilege is offered no Unlock button', async ({page, browser}) => {
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

interface ILockingSession {
    context: BrowserContext;
    lock: () => Promise<void>;
    unlock: () => Promise<void>;
}

/**
 * A second Superdesk session that can take and release the lock on `headline`, which
 * is the state every publish attempt below is refused over.
 *
 * Without an `actor` the context keeps the committed storageState and so locks as the
 * same user the test publishes as. Passing an actor forces a clean context that
 * authenticates as somebody else. Both end up refused as "locked by another user";
 * see the file docstring for why the lock owner makes no difference here.
 */
async function openLockingSession(
    browser: Browser,
    headline: string,
    actor?: {username: string; password: string},
): Promise<ILockingSession> {
    const context = actor == null
        ? await browser.newContext()
        : await browser.newContext({storageState: undefined});

    /*
     * The caller can only close this context once the session is handed back, so
     * anything that throws before the return has to close it here. Contexts made from
     * the `browser` fixture are not auto-closed until the worker ends, and a leaked one
     * means a live second Superdesk session holding a lock into every later test.
     */
    try {
        const page = await context.newPage();
        const monitoring = new Monitoring(page);

        if (actor != null) {
            await loginAs(page, actor.username, actor.password);
        }

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const item = monitoring.getArticleLocator(headline);

        await expect(item).toBeVisible();

        // the list item's DOM id is the article id, which is what the lock and unlock
        // requests are matched on below
        const itemId = await item.evaluate((element) => element.id);

        return {
            context,
            lock: async () => {
                // the lock is what the publishing session has to see, so the request
                // that takes it is awaited rather than the editor it opens
                const [response] = await Promise.all([
                    page.waitForResponse((r) => r.request().method() === 'POST'
                        && new URL(r.url()).pathname.endsWith(`/archive/${itemId}/lock`)),
                    monitoring.executeActionOnMonitoringItem(item, 'Edit'),
                ]);

                expect(response.status()).toBe(201);
            },
            unlock: async () => {
                const [response] = await Promise.all([
                    page.waitForResponse((r) => r.request().method() === 'POST'
                        && new URL(r.url()).pathname.endsWith(`/archive/${itemId}/unlock`)),
                    page.getByTestId('authoring-topbar').getByTestId('close').click(),
                ]);

                expect(response.status()).toBe(201);
            },
        };
    } catch (error) {
        await context.close();

        throw error;
    }
}

/**
 * Asserts an error notification came up, then waits for it to be gone.
 *
 * Only the first assertion states product behaviour. The rest is synchronisation:
 * notifications stack in the top right corner, over the send/publish pane, where they
 * can swallow the next click on Publish. Clicking one removes it (`removeMessage` in
 * scripts/core/notify/notify.tsx); the product removes an error notification on its
 * own after 8 seconds, so a click that finds nothing left is the same outcome.
 */
async function expectErrorNotification(page: Page, message: string): Promise<void> {
    const notification = page.getByTestId('notifications').getByTestId('notification--error')
        .filter({hasText: message});

    await expect(notification).toBeVisible();

    await notification.click({timeout: NOTIFICATION_CLICK_TIMEOUT_MS}).catch(() => undefined);

    await expect(notification).toBeHidden();
}

/**
 * Opens the send/publish pane of the article on screen and hands back the panel, so a
 * test can click Publish more than once without the second click toggling the pane
 * shut instead.
 */
async function openPublishPane(page: Page): Promise<Locator> {
    const authoring = page.getByTestId('authoring');

    await authoring.getByTestId('open-send-publish-pane').click();

    const panel = authoring.getByTestId('interactive-actions-panel');

    await expect(panel.getByTestId('publish')).toBeEnabled();

    return panel;
}

function deskOutputGroup(page: Page): Locator {
    return page.getByTestId('monitoring-group')
        .and(page.locator(`[data-test-value="${SPORTS_DESK_OUTPUT}"]`));
}

/**
 * The related-content field of the open article, which is also its drop zone.
 *
 * The block is addressed by display name through the shared authoring-field test id, and the
 * locator then descends to the inner element, because that is the one `RelatedItemsDirective`
 * binds `drop` to: a drop dispatched on the outer block fires beside the listener and is lost.
 */
function relatedItemsField(page: Page): Locator {
    return page.getByTestId('authoring')
        .getByTestId('authoring-field')
        .and(page.locator('[data-test-value="Shire related items"]'))
        .locator('[sd-related_items]');
}

/**
 * One row per item in the related-content field. The rows carry no id of their own
 * (`related-items.html` puts the same `id` on all of them), so they are counted through the
 * slugline their React list item renders.
 */
function relatedItemRows(page: Page): Locator {
    return relatedItemsField(page).getByTestId('field--slugline');
}

/**
 * The gallery field's carousel, which is the element `ItemCarouselDirective` binds `drop` to.
 * The upload placeholder inside it is only rendered while the gallery is empty, so a test that
 * adds a second item has to drop on the carousel itself.
 */
function galleryField(page: Page): Locator {
    return page.getByTestId('authoring').getByTestId('authoring-field')
        .and(page.locator(`[data-test-value="${GALLERY_FIELD}"]`))
        .locator('[sd-item-carousel]');
}

function galleryImages(page: Page): Locator {
    return galleryField(page).getByTestId('media-gallery-image');
}

/**
 * Saves the open article and waits for the write.
 *
 * Every association field in `article-edit.html` reports a change through a `data-onchange` that
 * calls `autosave`, so a dropped item only reaches `archive_autosave` until the article is saved,
 * and publishing validates the archive item rather than the autosave.
 */
async function saveOpenArticle(page: Page, articleId: string): Promise<void> {
    const saveButton = page.getByTestId('authoring-topbar').getByTestId('save');

    await expect(saveButton).toBeEnabled();

    const [saved] = await Promise.all([
        page.waitForResponse((r) => r.request().method() === 'PATCH'
            && new URL(r.url()).pathname.endsWith(`/archive/${articleId}`)),
        saveButton.click(),
    ]);

    expect(saved.status()).toBe(200);
}

function deskOutputItem(page: Page, headline: string): Locator {
    return deskOutputGroup(page).getByTestId('article-item').filter({hasText: headline});
}

/**
 * Opens a published item for correction from the desk output group.
 */
async function openCorrection(page: Page, headline: string): Promise<void> {
    const monitoring = new Monitoring(page);

    await monitoring.executeActionOnMonitoringItem(
        deskOutputItem(page, headline),
        'Publishing actions',
        'Correct item',
    );

    await expect(page.getByTestId('authoring')).toBeVisible();
    await expect(sendCorrection(page)).toBeVisible();
}

/**
 * Unlike Publish, Send Correction is a topbar button rather than an entry in the send/publish
 * pane, and it calls `$scope.publish()` straight away: nothing releases the correcting session's
 * own lock first, which is what makes the "locked by you" half of the refusal reachable here.
 */
function sendCorrection(page: Page): Locator {
    return page.getByTestId('authoring-topbar').getByRole('button', {name: 'Send Correction'});
}

/**
 * Drops the given articles into `field` one at a time, waiting for each to appear in `rows`.
 *
 * Both fields key a new association off the ones already on the item
 * (`RelatedItemsDirective.getNextKeyAndOrder`, `InitializeMediaService`), and the drop that puts
 * one there resolves asynchronously. Two drops in a row therefore compute the same key and the
 * second overwrites the first.
 */
async function dropAssociations(
    field: Locator,
    rows: Locator,
    articles: Array<{_id: string; type: string}>,
): Promise<void> {
    for (const [index, article] of articles.entries()) {
        await dropArticle(field, article);
        await expect(rows).toHaveCount(index + 1);
    }
}

test.describe('publishing an item whose association is locked', () => {
    test('an article whose Feature media item is locked by another user', {
        annotation: [
            // Publishing article with locked item in Feature media
            {type: 'confluence', description: '1328906297 partial'},
        ],
    }, async ({page, browser}) => {
        const authoring = new Authoring(page);
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const picture = monitoring.getArticleLocator(PICTURE);
        const article = monitoring.getArticleLocator(ARTICLE);

        await expect(picture).toBeVisible();

        /*
         * A list item's DOM id is the article id. The drop payload needs no more than
         * that and the type, because `ContentService.dropItem` re-fetches the item from
         * the API; the article's id is what its own save is matched on further down.
         */
        const pictureId = await picture.evaluate((element) => element.id);
        const articleId = await article.evaluate((element) => element.id);
        const lockOwner = await openLockingSession(browser, PICTURE, GRANTEE);

        try {
            await lockOwner.lock();

            await monitoring.executeActionOnMonitoringItem(article, 'Edit');
            await expect(page.getByTestId('authoring')).toBeVisible();

            const featureMedia = authoring.associationField('feature_media');
            const placeholder = featureMedia.getByTestId('upload-placeholder');

            await expect(placeholder).toBeVisible();

            await dropArticle(placeholder, {_id: pictureId, type: 'picture'});

            await expectErrorNotification(page, 'Item is locked. Cannot associate media item.');
            await expect(featureMedia.getByTestId('association-image')).toHaveCount(0);
            await expect(placeholder).toBeVisible();

            await lockOwner.unlock();

            await dropArticle(placeholder, {_id: pictureId, type: 'picture'});

            await expect(featureMedia.getByTestId('association-image')).toBeVisible();

            await saveOpenArticle(page, articleId);

            await lockOwner.lock();

            const publishPane = await openPublishPane(page);

            await publishPane.getByTestId('publish').click();

            await expectErrorNotification(page, `${PICTURE}: packaged item is locked by another user`);

            // a publish that goes through closes authoring (`article.ts` calls
            // `authoringWorkspace.close`), so the editor still being up is the refusal
            await expect(page.getByTestId('authoring')).toBeVisible();

            await lockOwner.unlock();

            await publishPane.getByTestId('publish').click();

            await expect(page.getByTestId('authoring')).toBeHidden();

            /*
             * The association is published alongside the article, which is what
             * PUBLISH_ASSOCIATED_ITEMS buys in exchange for the lock validation: the
             * picture leaves the working stage for the desk output group on its own.
             * It does not get a publish queue entry of its own here, so only the
             * article's is asserted below.
             */
            await expect(deskOutputGroup(page).getByTestId('article-item')
                .filter({hasText: ARTICLE})).toHaveCount(1);
            await expect(deskOutputGroup(page).getByTestId('article-item')
                .filter({hasText: PICTURE})).toHaveCount(1);

            await page.goto('/#/publish_queue');

            await expect(page.getByTestId('publish-queue-item').filter({hasText: ARTICLE})).toHaveCount(1);
        } finally {
            await lockOwner.context.close();
        }
    });

    test('a package whose item the publisher has locked in a second session', {
        annotation: [
            {type: 'confluence', description: '1328906291 complete'}, // Publishing package with locked item
        ],
    }, async ({page, browser}) => {
        const authoring = new Authoring(page);
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const packageItem = monitoring.getArticleLocator(PACKAGE);

        await expect(packageItem).toBeVisible();

        const packageId = await packageItem.evaluate((element) => element.id);

        await monitoring.executeActionOnMonitoringItem(packageItem, 'Edit');
        await expect(page.getByTestId('authoring')).toBeVisible();

        await monitoring.executeSubmenuAction(
            monitoring.getArticleLocator(ARTICLE),
            'Add to current',
            'main',
            {innerByTestId: 'add-to-package-group=main'},
        );

        await expect(
            page.getByTestId('authoring').getByTestId('package-items')
                .and(page.locator(`[data-test-value="${ARTICLE}"]`)),
        ).toBeVisible();

        const [packageSaved] = await Promise.all([
            page.waitForResponse((r) => r.request().method() === 'PATCH'
                && new URL(r.url()).pathname.endsWith(`/archive/${packageId}`)),
            page.getByTestId('authoring-topbar').getByTestId('save').click(),
        ]);

        expect(packageSaved.status()).toBe(200);

        await authoring.close();

        const lockOwner = await openLockingSession(browser, ARTICLE);

        try {
            await lockOwner.lock();

            await monitoring.executeActionOnMonitoringItem(monitoring.getArticleLocator(PACKAGE), 'Edit');
            await expect(page.getByTestId('authoring')).toBeVisible();

            const publishPane = await openPublishPane(page);

            await publishPane.getByTestId('publish').click();

            /*
             * The lock is held by the publishing user, which is the case's own
             * "locked by you" wording, and the product still says "another user":
             * `beforeSend` released the package's own lock before the request, so the
             * validator has nothing to recognise the lock owner as the publisher by.
             */
            await expectErrorNotification(page, `${ARTICLE}: packaged item is locked by another user`);
            await expect(page.getByTestId('authoring')).toBeVisible();

            await lockOwner.unlock();

            await publishPane.getByTestId('publish').click();

            await expect(page.getByTestId('authoring')).toBeHidden();

            await expect(deskOutputGroup(page).getByTestId('article-item')
                .filter({hasText: PACKAGE})).toHaveCount(1);
            await expect(deskOutputGroup(page).getByTestId('article-item')
                .filter({hasText: ARTICLE})).toHaveCount(1);
            await expect(deskOutputGroup(page).getByTestId('article-item')
                .filter({hasText: PACKAGED_STORY})).toHaveCount(1);
        } finally {
            await lockOwner.context.close();
        }
    });

    test('an article one of whose related items is locked', {
        annotation: [
            // Publishing article with related locked item
            {type: 'confluence', description: '1328906265 complete'},
        ],
    }, async ({page, browser}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot({snapshotName: ASSOCIATION_FIELDS});

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const article = monitoring.getArticleLocator(ARTICLE);

        await expect(article).toBeVisible();

        const articleId = await article.evaluate((element) => element.id);
        const relatedIds: Array<string> = [];

        for (const headline of RELATED_ITEMS) {
            relatedIds.push(await monitoring.getArticleLocator(headline).evaluate((element) => element.id));
        }

        await monitoring.executeActionOnMonitoringItem(article, 'Edit');
        await expect(page.getByTestId('authoring')).toBeVisible();

        await dropAssociations(
            relatedItemsField(page),
            relatedItemRows(page),
            relatedIds.map((_id) => ({_id, type: 'text'})),
        );

        await saveOpenArticle(page, articleId);

        const lockOwner = await openLockingSession(browser, RELATED_ITEMS[1]);

        try {
            await lockOwner.lock();

            const publishPane = await openPublishPane(page);

            await publishPane.getByTestId('publish').click();

            await expectErrorNotification(page, `${RELATED_ITEMS[1]}: packaged item is locked by another user`);

            // a publish that goes through closes authoring (`article.ts` calls
            // `authoringWorkspace.close`), so the editor still being up is the refusal
            await expect(page.getByTestId('authoring')).toBeVisible();

            await lockOwner.unlock();

            await publishPane.getByTestId('publish').click();

            await expect(page.getByTestId('authoring')).toBeHidden();

            /*
             * PUBLISH_ASSOCIATED_ITEMS publishes the related items along with the article,
             * so all three leave the working stage for the desk output group.
             */
            await expect(deskOutputItem(page, ARTICLE)).toHaveCount(1);

            for (const headline of RELATED_ITEMS) {
                await expect(deskOutputItem(page, headline)).toHaveCount(1);
            }
        } finally {
            await lockOwner.context.close();
        }
    });

    test('an article whose gallery holds a locked picture', {
        annotation: [
            // Publishing gallery with locked item
            {type: 'confluence', description: '1328906307 partial'},
        ],
    }, async ({page, browser}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot({snapshotName: ASSOCIATION_FIELDS});

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const article = monitoring.getArticleLocator(ARTICLE);
        const picture = monitoring.getArticleLocator(GALLERY_PICTURES[0]);

        await expect(picture).toBeVisible();

        const articleId = await article.evaluate((element) => element.id);
        const pictureId = await picture.evaluate((element) => element.id);
        const lockOwner = await openLockingSession(browser, GALLERY_PICTURES[0]);

        try {
            await lockOwner.lock();

            await monitoring.executeActionOnMonitoringItem(article, 'Edit');
            await expect(page.getByTestId('authoring')).toBeVisible();

            const gallery = galleryField(page);

            await expect(gallery.getByTestId('media-gallery--upload-placeholder')).toBeVisible();

            await dropArticle(gallery, {_id: pictureId, type: 'picture'});

            await expectErrorNotification(page, 'Item is locked. Cannot associate media item.');

            // the placeholder only renders while the gallery is empty, so it still being
            // there is the picture not having been added
            await expect(gallery.getByTestId('media-gallery--upload-placeholder')).toBeVisible();
            await expect(galleryImages(page)).toHaveCount(0);

            await lockOwner.unlock();

            await dropArticle(gallery, {_id: pictureId, type: 'picture'});

            await expect(galleryImages(page)).toHaveCount(1);

            await saveOpenArticle(page, articleId);

            await lockOwner.lock();

            const publishPane = await openPublishPane(page);

            await publishPane.getByTestId('publish').click();

            await expectErrorNotification(
                page,
                `${GALLERY_PICTURES[0]}: packaged item is locked by another user`,
            );
            await expect(page.getByTestId('authoring')).toBeVisible();

            await lockOwner.unlock();

            await publishPane.getByTestId('publish').click();

            await expect(page.getByTestId('authoring')).toBeHidden();
            await expect(deskOutputItem(page, ARTICLE)).toHaveCount(1);
            await expect(deskOutputItem(page, GALLERY_PICTURES[0])).toHaveCount(1);
        } finally {
            await lockOwner.context.close();
        }
    });
});

test.describe('correcting an item whose association is locked', () => {
    test('an article gaining a locked related item in the correction', {
        annotation: [
            // Correcting article with related locked item
            {type: 'confluence', description: '1328906267 complete'},
        ],
    }, async ({page, browser}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot({snapshotName: ASSOCIATION_FIELDS});

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const article = monitoring.getArticleLocator(ARTICLE);

        await expect(article).toBeVisible();

        const articleId = await article.evaluate((element) => element.id);
        const relatedIds: Array<string> = [];

        for (const headline of RELATED_ITEMS) {
            relatedIds.push(await monitoring.getArticleLocator(headline).evaluate((element) => element.id));
        }

        const correctionId = await monitoring.getArticleLocator(CORRECTION_RELATED_ITEM)
            .evaluate((element) => element.id);

        await monitoring.executeActionOnMonitoringItem(article, 'Edit');
        await expect(page.getByTestId('authoring')).toBeVisible();

        await dropAssociations(
            relatedItemsField(page),
            relatedItemRows(page),
            relatedIds.map((_id) => ({_id, type: 'text'})),
        );

        await saveOpenArticle(page, articleId);

        const publishPane = await openPublishPane(page);

        await publishPane.getByTestId('publish').click();

        await expect(page.getByTestId('authoring')).toBeHidden();
        await expect(deskOutputItem(page, ARTICLE)).toHaveCount(1);

        await openCorrection(page, ARTICLE);

        await dropArticle(relatedItemsField(page), {_id: correctionId, type: 'text'});

        /*
         * Not saved before sending: a correction has no Save button (`itemActions.save` is off
         * for a published item), and it needs none. Send Correction posts the in-memory item,
         * so the association added here travels with the correction request.
         */
        await expect(relatedItemRows(page)).toHaveCount(RELATED_ITEMS.length + 1);

        const lockOwner = await openLockingSession(browser, CORRECTION_RELATED_ITEM);

        try {
            await lockOwner.lock();

            await sendCorrection(page).click();

            /*
             * The lock is held by the correcting user in a second session and the correction
             * keeps its own lock, so the validator recognises the lock owner as the publisher
             * and words the refusal the other way round than the publish tests above do.
             */
            await expectErrorNotification(
                page,
                `${CORRECTION_RELATED_ITEM}: packaged item is locked by you. Unlock it and try again`,
            );
            await expect(page.getByTestId('authoring')).toBeVisible();

            await lockOwner.unlock();

            await sendCorrection(page).click();

            await expect(page.getByTestId('authoring')).toBeHidden();
            await expect(deskOutputItem(page, CORRECTION_RELATED_ITEM)).toHaveCount(1);
        } finally {
            await lockOwner.context.close();
        }
    });

    test('an article gaining a locked gallery picture in the correction', {
        annotation: [
            // Correcting gallery with locked item
            {type: 'confluence', description: '1328906320 partial'},
        ],
    }, async ({page, browser}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot({snapshotName: ASSOCIATION_FIELDS});

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const article = monitoring.getArticleLocator(ARTICLE);

        await expect(article).toBeVisible();

        const articleId = await article.evaluate((element) => element.id);
        const pictureIds: Array<string> = [];

        for (const headline of GALLERY_PICTURES) {
            pictureIds.push(await monitoring.getArticleLocator(headline).evaluate((element) => element.id));
        }

        const correctionId = await monitoring.getArticleLocator(CORRECTION_PICTURE)
            .evaluate((element) => element.id);

        await monitoring.executeActionOnMonitoringItem(article, 'Edit');
        await expect(page.getByTestId('authoring')).toBeVisible();

        await dropAssociations(
            galleryField(page),
            galleryImages(page),
            pictureIds.map((_id) => ({_id, type: 'picture'})),
        );

        await saveOpenArticle(page, articleId);

        const publishPane = await openPublishPane(page);

        await publishPane.getByTestId('publish').click();

        await expect(page.getByTestId('authoring')).toBeHidden();
        await expect(deskOutputItem(page, ARTICLE)).toHaveCount(1);

        await openCorrection(page, ARTICLE);

        await dropArticle(galleryField(page), {_id: correctionId, type: 'picture'});

        // See the related-items correction test: a correction has no Save button, and the
        // association added here travels with the Send Correction request.
        await expect(galleryImages(page)).toHaveCount(GALLERY_PICTURES.length + 1);

        const lockOwner = await openLockingSession(browser, CORRECTION_PICTURE);

        try {
            await lockOwner.lock();

            await sendCorrection(page).click();

            await expectErrorNotification(
                page,
                `${CORRECTION_PICTURE}: packaged item is locked by you. Unlock it and try again`,
            );
            await expect(page.getByTestId('authoring')).toBeVisible();

            await lockOwner.unlock();

            await sendCorrection(page).click();

            await expect(page.getByTestId('authoring')).toBeHidden();
            await expect(deskOutputItem(page, CORRECTION_PICTURE)).toHaveCount(1);
        } finally {
            await lockOwner.context.close();
        }
    });
});

/*
 * Placeholder so the case of this batch that stays uncovered is machine-readable next to the
 * ones that are covered, instead of living only in the file docstring. See that docstring for
 * the reason.
 */
test.fixme('correcting a package whose member is locked', {
    annotation: [
        {type: 'confluence', description: '1328906312 blocker'}, // Correcting package with locked item
    ],
}, async () => {
    // Package members are not lock-validated on a correction.
});
