import {Browser, BrowserContext, Locator, Page, expect, test} from '@playwright/test';
import {Authoring, PackageAuthoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {Users} from './page-object-models/users';
import {UserRolesSettings} from './page-object-models/settings/user-roles';
import {expectErrorNotification, newSession, restoreDatabaseSnapshot} from './utils';
import {lockArchiveItem, patchArchiveItem} from './utils/archive-api';
import {dropArticle} from './utils/drag-and-drop';
import {getStorageState} from './utils/storage-state';

/**
 * QA "Locked items" cases on authoring-react: locking, unlocking and the Unlock content privilege,
 * and publishing or correcting an item whose association is locked. The scenarios and the product
 * wording follow `locked-items.spec.ts` and `lock-item.spec.ts`, whose docstrings explain the
 * server-side rules (PUBLISH_ASSOCIATED_ITEMS, which publishes and lock-checks associations).
 *
 * Every session, including the second actor's, runs authoring-react, and each one checks the
 * React-only secondary toolbar so a shared locator cannot pass on an angular editor.
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});

// two Superdesk sessions plus several lock and publish round trips
test.setTimeout(180000);

const ARTICLE = 'test sports story';
const LOCK_OWNER_NAME = 'John Doe';
const GRANTEE = {username: 'samgamgee', password: 'samgamgee', displayName: 'Sam Gamgee'};
const GRANTEE_ROLE = 'Sub Editor';
const UNLOCK_PRIVILEGE = 'unlock';
const ASSOCIATION_FIELDS = 'association-fields';
const RELATED_FIELD = 'shire_related_items';
const GALLERY_FIELD = 'shire_gallery';
const RELATED_ITEMS = ['Bree bulletin', 'Rohan dispatch'];
const CORRECTION_RELATED_ITEM = 'Weathertop note';
const GALLERY_PICTURES = ['Gondor picture', 'Mirkwood picture'];
const CORRECTION_PICTURE = 'Fangorn picture';
const PICTURE = 'Rivendell picture';

function deskOutputItem(page: Page, label: string): Locator {
    return new Monitoring(page).getGroupedArticleLocator('Sports desk output', label);
}

function workingStageItem(page: Page, label: string): Locator {
    return new Monitoring(page).getGroupedArticleLocator('Sports / Working Stage', label);
}

async function openSportsMonitoring(page: Page, label: string = ARTICLE): Promise<Monitoring> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    // the post-restore reindex briefly empties the list
    await expect(workingStageItem(page, label)).toBeVisible();

    return monitoring;
}

async function expectAuthoringReact(page: Page): Promise<void> {
    await expect(page.getByTestId('authoring-secondary-toolbar')).toBeVisible();
}

function saveButton(page: Page): Locator {
    return page.getByTestId('authoring').getByTestId('authoring-toolbar-1').getByTestId('save');
}

function lockedInfo(page: Page): Locator {
    return page.getByTestId('authoring').getByTestId('locked-info');
}

/** Opens `label` for editing and waits for the lock it takes to reach the list. */
async function lockForEditing(page: Page, label: string = ARTICLE): Promise<void> {
    const monitoring = await openSportsMonitoring(page, label);
    const item = workingStageItem(page, label);

    await monitoring.executeActionOnMonitoringItem(item, 'Edit');
    await expectAuthoringReact(page);
    await expect(saveButton(page)).toBeVisible();
    await expect(item.getByTestId('article-item-locked')).toHaveCount(1);
}

/** Opens the item locked by someone else; authoring-react opens it read-only. */
async function openLockedArticle(page: Page): Promise<void> {
    await openSportsMonitoring(page);

    const item = workingStageItem(page, ARTICLE);

    await expect(item.getByTestId('article-item-locked')).toHaveCount(1);
    await item.dblclick();
    await expectAuthoringReact(page);
    await expect(lockedInfo(page)).toBeVisible();
}

// a read-only Draft.js editor drops its textbox role, so the editable element is found by its attribute
async function expectEditable(page: Page, editable: boolean): Promise<void> {
    const headline = page.getByTestId('authoring')
        .getByTestId('authoring-field')
        .and(page.locator('[data-test-value="headline"]'))
        .locator('[contenteditable]');

    await expect(headline).toHaveAttribute('contenteditable', editable ? 'true' : 'false');
}

// the panel renders label and name as adjacent blocks, so its text runs them together
async function expectLockedBy(page: Page, name: string): Promise<void> {
    await expect(lockedInfo(page)).toContainText(new RegExp(`Locked by\\s*${name}`));
}

interface ILockingSession {
    context: BrowserContext;
    lock(): Promise<void>;
    unlock(): Promise<void>;
}

/** A second admin session that takes and releases the lock on `label` through its own editor. */
async function openLockingSession(browser: Browser, label: string): Promise<ILockingSession> {
    const {context, page} = await newSession(browser);

    try {
        const monitoring = await openSportsMonitoring(page, label);
        const item = workingStageItem(page, label);
        const itemId = await item.evaluate((element) => element.id);
        const lockRequest = (action: 'lock' | 'unlock') => page.waitForResponse((r) => r.request().method() === 'POST'
            && new URL(r.url()).pathname.endsWith(`/archive/${itemId}/${action}`));

        return {
            context,
            lock: async () => {
                const [response] = await Promise.all([
                    lockRequest('lock'),
                    monitoring.executeActionOnMonitoringItem(item, 'Edit'),
                ]);

                expect(response.status()).toBe(201);
                await expectAuthoringReact(page);
            },
            unlock: async () => {
                const [response] = await Promise.all([
                    lockRequest('unlock'),
                    new Authoring(page).close(),
                ]);

                expect(response.status()).toBe(201);
            },
        };
    } catch (error) {
        await context.close();

        throw error;
    }
}

async function dropItem(target: Locator, label: string, type: 'picture' | 'text'): Promise<void> {
    const id = await workingStageItem(target.page(), label).evaluate((element) => element.id);

    await dropArticle(target, {_id: id, type});
}

/**
 * The second session locks as the publishing user, and authoring-react keeps the item's own lock
 * while publishing, so the validator recognises the publisher as the lock owner. Angular releases
 * that lock first (`beforeSend`) and so words the same publish refusal "locked by another user".
 */
async function expectLockedByYouRefusal(page: Page, label: string): Promise<void> {
    await expectErrorNotification(page, `${label}: packaged item is locked by you. Unlock it and try again`);
}

function dropZone(authoring: Authoring, fieldId: string): Locator {
    return authoring.fieldContainer(fieldId).getByTestId('drop-zone').last();
}

// the media field fetches a dropped item before adding it, so a drop lands after a round trip
function galleryThumbnails(authoring: Authoring): Locator {
    return authoring.fieldContainer(GALLERY_FIELD).getByTestId('media-thumbnail');
}

function relatedItem(authoring: Authoring, label: string): Locator {
    return authoring.fieldContainer(RELATED_FIELD).getByTestId('field--slugline').filter({hasText: label});
}

async function publishFromPanel(authoring: Authoring): Promise<Locator> {
    const panel = await authoring.openActionsPanel('Publish');

    await panel.getByTestId('publish').click();

    return panel;
}

async function associationKeys(authoring: Authoring): Promise<Array<string>> {
    const {request} = await authoring.saveAndGetRequest();

    return Object.keys(request.associations ?? {});
}

test.describe('locking an item that is open for editing', {
    annotation: [
        {type: 'confluence', description: '1308524847 complete'}, // Lock item
    ],
}, () => {
    test('another user gets it read-only, naming the lock owner', async ({page, browser}) => {
        await restoreDatabaseSnapshot();
        await lockForEditing(page);

        const observer = await newSession(browser, GRANTEE);

        try {
            await openLockedArticle(observer.page);

            await expectLockedBy(observer.page, LOCK_OWNER_NAME);
            await expect(saveButton(observer.page)).toHaveCount(0);
            await expectEditable(observer.page, false);
        } finally {
            await observer.context.close();
        }
    });

    test('a user without the Unlock content privilege is offered no Unlock button', async ({page, browser}) => {
        await restoreDatabaseSnapshot();
        await lockForEditing(page);

        const observer = await newSession(browser, GRANTEE);

        try {
            await openLockedArticle(observer.page);
            await expectLockedBy(observer.page, LOCK_OWNER_NAME);
            await expect(lockedInfo(observer.page).getByTestId('unlock')).toBeHidden();
        } finally {
            await observer.context.close();
        }
    });

    test('a user with the Unlock content privilege unlocks it and gets it for editing', async ({page, browser}) => {
        await restoreDatabaseSnapshot();

        const owner = await newSession(browser, GRANTEE);

        try {
            await lockForEditing(owner.page);
            await openLockedArticle(page);

            await expectLockedBy(page, GRANTEE.displayName);
            await expectEditable(page, false);

            await lockedInfo(page).getByTestId('unlock').click();

            await expect(lockedInfo(page)).toHaveCount(0);
            await expect(saveButton(page)).toBeVisible();
            await expectEditable(page, true);

            // the former owner's editor follows the lock to its new holder
            await expectLockedBy(owner.page, LOCK_OWNER_NAME);
        } finally {
            await owner.context.close();
        }
    });

    test('the user whose lock was taken is told who unlocked the item', {
        annotation: [
            {type: 'confluence', description: '1311834225 complete'}, // Unlock item
        ],
    }, async ({page, browser}) => {
        await restoreDatabaseSnapshot();

        const owner = await newSession(browser, GRANTEE);

        try {
            await lockForEditing(owner.page);
            await openLockedArticle(page);
            await lockedInfo(page).getByTestId('unlock').click();
            await expect(saveButton(page)).toBeVisible();

            const dialog = owner.page.getByTestId('modal-confirm');

            await expect(dialog).toContainText('Item Unlocked');
            await expect(dialog).toContainText(`Item ${ARTICLE} was unlocked by ${LOCK_OWNER_NAME}.`);
        } finally {
            await owner.context.close();
        }
    });
});

test.describe('a locked related item', () => {
    // ids baked into the `association-fields` snapshot; "Story 5" is published
    const ITEMS = {
        article: 'urn:newsml:localhost:5000:2023-11-15T10:53:56.032654:3503f3f4-1d5f-48b2-8f3d-35120820d8ee',
        published: 'urn:newsml:localhost:5000:2025-04-29T08:18:00.176925:d15f9b5a-55e1-4abb-9312-9224c7654ed6',
        inProgress: 'urn:newsml:localhost:5000:2026-08-10T00:00:01.000000:association-fields-1',
    };

    function lockedRelatedItem(page: Page, label: string): Locator {
        return new Authoring(page).fieldContainer(RELATED_FIELD).getByTestId('linked-item-locked')
            .filter({has: page.getByTestId('field--slugline').filter({hasText: label})});
    }

    test('is marked in the related items field, published or not, as it gets locked', async ({page}) => {
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot({snapshotName: ASSOCIATION_FIELDS});
        await patchArchiveItem(ITEMS.article, {
            associations: {
                [`${RELATED_FIELD}--1`]: {_id: ITEMS.published, type: 'text', order: 0},
                [`${RELATED_FIELD}--2`]: {_id: ITEMS.inProgress, type: 'text', order: 1},
            },
        });
        await lockArchiveItem(ITEMS.published);

        await openSportsMonitoring(page);
        await workingStageItem(page, ARTICLE).dblclick();
        await expectAuthoringReact(page);
        await authoring.waitForAuthoringReactToInitialize();

        await expect(relatedItem(authoring, RELATED_ITEMS[0])).toBeVisible();
        await expect(lockedRelatedItem(page, 'Story 5')).toBeVisible();
        await expect(lockedRelatedItem(page, RELATED_ITEMS[0])).toHaveCount(0);

        await lockArchiveItem(ITEMS.inProgress);
        await expect(lockedRelatedItem(page, RELATED_ITEMS[0])).toBeVisible();
    });
});

test.describe('granting the Unlock content privilege', () => {
    async function unlockAsGrantee(page: Page, browser: Browser): Promise<void> {
        await lockForEditing(page);

        const grantee = await newSession(browser, GRANTEE);

        try {
            await openLockedArticle(grantee.page);
            await lockedInfo(grantee.page).getByTestId('unlock').click();

            await expect(saveButton(grantee.page)).toBeVisible();
            await expectEditable(grantee.page, true);
            await expectLockedBy(page, GRANTEE.displayName);
        } finally {
            await grantee.context.close();
        }
    }

    test('granted to an individual user, it lets that user unlock the item', {
        annotation: [
            {type: 'confluence', description: '1311834235 complete'}, // Grant Unlock content to individual user
            {type: 'confluence', description: '1311834225 complete'}, // Unlock item
        ],
    }, async ({page, browser}) => {
        await restoreDatabaseSnapshot();

        const users = new Users(page);

        await users.openList();
        await users.openFullProfile(GRANTEE.displayName);
        await users.openProfileSection('privileges');

        const form = page.getByTestId('user-privileges-form');
        const checkbox = form.getByTestId('privilege-row')
            .and(page.locator(`[data-test-value="${UNLOCK_PRIVILEGE}"]`))
            .getByTestId('privilege-checkbox');

        await expect(checkbox).not.toBeChecked();
        await checkbox.check();

        const [saved] = await Promise.all([
            page.waitForResponse((r) => r.url().includes('/api/users/') && r.request().method() === 'PATCH'),
            form.getByTestId('action-bar').getByTestId('save').click(),
        ]);

        expect(saved.status()).toBe(200);
        await expect(page.getByTestId('notification--success').filter({hasText: 'Privileges updated.'}))
            .toBeVisible();

        await unlockAsGrantee(page, browser);
    });

    test('granted through a user role, it lets the role\'s users unlock the item', {
        annotation: [
            {type: 'confluence', description: '1311834233 complete'}, // Grant Unlock content via user role
        ],
    }, async ({page, browser}) => {
        await restoreDatabaseSnapshot();

        const roles = new UserRolesSettings(page);

        await roles.open();
        await roles.openPrivilegesTab();
        expect(await roles.getPrivilegeNames()).toContain(UNLOCK_PRIVILEGE);
        await expect(roles.getPrivilegeCheckbox(UNLOCK_PRIVILEGE, GRANTEE_ROLE)).not.toBeChecked();
        await roles.getPrivilegeCheckbox(UNLOCK_PRIVILEGE, GRANTEE_ROLE).check();
        await roles.savePrivileges();
        await expect(page.getByTestId('notification--success').filter({hasText: 'Privileges updated.'}))
            .toBeVisible();

        await unlockAsGrantee(page, browser);
    });
});

test.describe('publishing an item whose association is locked', () => {
    test('a Feature media picture locked by another user is refused on drop', {
        annotation: [
            // Publishing article with locked item in Feature media
            {type: 'confluence', description: '1328906297 partial'},
        ],
    }, async ({page, browser}) => {
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const lockOwner = await openLockingSession(browser, PICTURE);

        try {
            await lockOwner.lock();
            await lockForEditing(page);
            await authoring.waitForAuthoringReactToInitialize();

            await dropItem(dropZone(authoring, 'feature_media'), PICTURE, 'picture');
            await expectErrorNotification(page, 'Item is locked. Cannot associate media item.');
        } finally {
            await lockOwner.context.close();
        }
    });

    test('a locked Feature media picture blocks the publish until it is unlocked', {
        annotation: [
            // Publishing article with locked item in Feature media
            {type: 'confluence', description: '1328906297 partial'},
        ],
    }, async ({page, browser}) => {
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot({snapshotName: 'media-items'});
        await lockForEditing(page);
        await authoring.waitForAuthoringReactToInitialize();

        await dropItem(dropZone(authoring, 'feature_media'), PICTURE, 'picture');
        await expect(authoring.fieldContainer('feature_media').getByTestId('media-carousel-image')).toBeVisible();
        expect(await associationKeys(authoring)).toContain('featuremedia');

        const lockOwner = await openLockingSession(browser, PICTURE);

        try {
            await lockOwner.lock();

            const panel = await publishFromPanel(authoring);

            await expectLockedByYouRefusal(page, PICTURE);
            await expect(page.getByTestId('authoring')).toBeVisible();

            await lockOwner.unlock();
            await panel.getByTestId('publish').click();

            await expect(page.getByTestId('authoring')).toBeHidden();
            await expect(deskOutputItem(page, ARTICLE)).toHaveCount(1);
            await expect(deskOutputItem(page, PICTURE)).toHaveCount(1);

            // authoring-react publishes without releasing the item's lock first; it must not outlive the publish
            await expect(deskOutputItem(page, ARTICLE).getByTestId('article-item-locked')).toHaveCount(0);
        } finally {
            await lockOwner.context.close();
        }
    });

    test('a package whose item is locked is refused, then published with the item once it is unlocked', {
        annotation: [
            {type: 'confluence', description: '1328906291 complete'}, // Publishing package with locked item
        ],
    }, async ({page, browser}) => {
        const authoring = new Authoring(page);
        const monitoring = new Monitoring(page);
        const PACKAGE = 'Package Highlight 1';

        await restoreDatabaseSnapshot();
        await lockForEditing(page, PACKAGE);
        await authoring.waitForAuthoringReactToInitialize();

        // "Story 3", the package's own item, has no headline for the refusal to name
        await monitoring.executeSubmenuAction(
            workingStageItem(page, ARTICLE),
            'Add to current',
            'main',
            {innerByTestId: 'add-to-package-group=main'},
        );
        await expect(new PackageAuthoring(page).item(ARTICLE)).toBeVisible();
        await authoring.saveAndGetRequest();

        const lockOwner = await openLockingSession(browser, ARTICLE);

        try {
            await lockOwner.lock();

            const panel = await publishFromPanel(authoring);

            await expectLockedByYouRefusal(page, ARTICLE);
            await expect(page.getByTestId('authoring')).toBeVisible();

            // the editor refreshes its work queue 150ms after the unlock reaches it, so by then a
            // reopen of the package (`workqueue.ts`) would have remounted it and closed the panel
            const workqueueRefreshed = page.waitForResponse(
                (r) => new URL(r.url()).pathname.endsWith('/workqueue'),
                {timeout: 15000},
            );

            await lockOwner.unlock();
            await workqueueRefreshed;
            await expect(panel.getByTestId('publish')).toBeVisible();
            await panel.getByTestId('publish').click();

            await expect(page.getByTestId('authoring')).toBeHidden();
            await expect(deskOutputItem(page, PACKAGE)).toHaveCount(1);
            await expect(deskOutputItem(page, ARTICLE)).toHaveCount(1);
            await expect(deskOutputItem(page, 'Story 3')).toHaveCount(1);
        } finally {
            await lockOwner.context.close();
        }
    });

    test('an article whose related item is locked is refused, then published once the item is unlocked', {
        annotation: [
            // Publishing article with related locked item
            {type: 'confluence', description: '1328906265 complete'},
        ],
    }, async ({page, browser}) => {
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot({snapshotName: ASSOCIATION_FIELDS});
        await lockForEditing(page);
        await authoring.waitForAuthoringReactToInitialize();

        // each drop derives its key from the ones already there, so wait for one before the next
        for (const label of RELATED_ITEMS) {
            await dropItem(dropZone(authoring, RELATED_FIELD), label, 'text');
            await expect(relatedItem(authoring, label)).toBeVisible();
        }

        expect((await associationKeys(authoring)).filter((key) => key.startsWith(RELATED_FIELD))).toHaveLength(2);

        const lockOwner = await openLockingSession(browser, RELATED_ITEMS[1]);

        try {
            await lockOwner.lock();

            const panel = await publishFromPanel(authoring);

            await expectLockedByYouRefusal(page, RELATED_ITEMS[1]);
            await expect(page.getByTestId('authoring')).toBeVisible();

            await lockOwner.unlock();
            await panel.getByTestId('publish').click();

            await expect(page.getByTestId('authoring')).toBeHidden();
            await expect(deskOutputItem(page, ARTICLE)).toHaveCount(1);

            for (const label of RELATED_ITEMS) {
                await expect(deskOutputItem(page, label)).toHaveCount(1);
            }
        } finally {
            await lockOwner.context.close();
        }
    });

    test('an article whose gallery picture is locked is refused, then published once it is unlocked', {
        annotation: [
            // Publishing gallery with locked item
            {type: 'confluence', description: '1328906307 partial'},
        ],
    }, async ({page, browser}) => {
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot({snapshotName: ASSOCIATION_FIELDS});
        await lockForEditing(page);
        await authoring.waitForAuthoringReactToInitialize();

        await dropItem(dropZone(authoring, GALLERY_FIELD), GALLERY_PICTURES[0], 'picture');
        await expect(galleryThumbnails(authoring)).toHaveCount(1);
        expect((await associationKeys(authoring)).filter((key) => key.startsWith(GALLERY_FIELD))).toHaveLength(1);

        const lockOwner = await openLockingSession(browser, GALLERY_PICTURES[0]);

        try {
            await lockOwner.lock();

            const panel = await publishFromPanel(authoring);

            await expectLockedByYouRefusal(page, GALLERY_PICTURES[0]);
            await expect(page.getByTestId('authoring')).toBeVisible();

            await lockOwner.unlock();
            await panel.getByTestId('publish').click();

            await expect(page.getByTestId('authoring')).toBeHidden();
            await expect(deskOutputItem(page, ARTICLE)).toHaveCount(1);
            await expect(deskOutputItem(page, GALLERY_PICTURES[0])).toHaveCount(1);
        } finally {
            await lockOwner.context.close();
        }
    });

    test('a locked picture dropped into the gallery is refused', {
        annotation: [
            // Publishing gallery with locked item
            {type: 'confluence', description: '1328906307 partial'},
        ],
    }, async ({page, browser}) => {
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot({snapshotName: ASSOCIATION_FIELDS});

        const lockOwner = await openLockingSession(browser, GALLERY_PICTURES[0]);

        try {
            await lockOwner.lock();
            await lockForEditing(page);
            await authoring.waitForAuthoringReactToInitialize();

            await dropItem(dropZone(authoring, GALLERY_FIELD), GALLERY_PICTURES[0], 'picture');
            await expectErrorNotification(page, 'Item is locked. Cannot associate media item.');
        } finally {
            await lockOwner.context.close();
        }
    });
});

test.describe('correcting an item whose association is locked', () => {
    /**
     * Publishes the article with `field` holding `labels`, then opens it for correction. The
     * correction is not saved before sending: Send Correction posts the in-memory item.
     */
    async function publishThenCorrect(page: Page, field: string, labels: Array<string>): Promise<Authoring> {
        const authoring = new Authoring(page);
        const monitoring = new Monitoring(page);

        await lockForEditing(page);
        await authoring.waitForAuthoringReactToInitialize();

        for (const [index, label] of labels.entries()) {
            if (field === RELATED_FIELD) {
                await dropItem(dropZone(authoring, field), label, 'text');
                await expect(relatedItem(authoring, label)).toBeVisible();
            } else {
                await dropItem(dropZone(authoring, field), label, 'picture');
                await expect(galleryThumbnails(authoring)).toHaveCount(index + 1);
            }
        }

        expect((await associationKeys(authoring)).filter((key) => key.startsWith(field)))
            .toHaveLength(labels.length);

        await publishFromPanel(authoring);
        await expect(page.getByTestId('authoring')).toBeHidden();
        await expect(deskOutputItem(page, ARTICLE)).toHaveCount(1);

        await monitoring.executeActionOnMonitoringItem(
            deskOutputItem(page, ARTICLE),
            'Publishing actions',
            'Correct item',
        );
        await expectAuthoringReact(page);
        await authoring.waitForAuthoringReactToInitialize();

        return authoring;
    }

    async function sendCorrectionRefusedThenAccepted(
        page: Page,
        browser: Browser,
        addedLabel: string,
    ): Promise<void> {
        const sendCorrection = page.getByTestId('authoring').getByTestId('send-correction');
        const lockOwner = await openLockingSession(browser, addedLabel);

        try {
            await lockOwner.lock();
            await sendCorrection.click();

            await expectLockedByYouRefusal(page, addedLabel);
            await expect(page.getByTestId('authoring')).toBeVisible();

            await lockOwner.unlock();
            await sendCorrection.click();

            await expect(page.getByTestId('authoring')).toBeHidden();
            await expect(deskOutputItem(page, addedLabel)).toHaveCount(1);
        } finally {
            await lockOwner.context.close();
        }
    }

    test('an article gaining a locked related item in the correction', {
        annotation: [
            // Correcting article with related locked item
            {type: 'confluence', description: '1328906267 complete'},
        ],
    }, async ({page, browser}) => {
        await restoreDatabaseSnapshot({snapshotName: ASSOCIATION_FIELDS});

        const authoring = await publishThenCorrect(page, RELATED_FIELD, RELATED_ITEMS);

        await dropItem(dropZone(authoring, RELATED_FIELD), CORRECTION_RELATED_ITEM, 'text');
        await expect(relatedItem(authoring, CORRECTION_RELATED_ITEM)).toBeVisible();

        await sendCorrectionRefusedThenAccepted(page, browser, CORRECTION_RELATED_ITEM);
    });

    test('a correction adding a locked gallery picture is refused until the picture is unlocked', {
        annotation: [
            // Correcting gallery with locked item
            {type: 'confluence', description: '1328906320 partial'},
        ],
    }, async ({page, browser}) => {
        await restoreDatabaseSnapshot({snapshotName: ASSOCIATION_FIELDS});

        const authoring = await publishThenCorrect(page, GALLERY_FIELD, GALLERY_PICTURES);

        await dropItem(dropZone(authoring, GALLERY_FIELD), CORRECTION_PICTURE, 'picture');
        await expect(galleryThumbnails(authoring)).toHaveCount(GALLERY_PICTURES.length + 1);

        await sendCorrectionRefusedThenAccepted(page, browser, CORRECTION_PICTURE);
    });
});

// Known product gap, see `locked-items.spec.ts`: package members are not lock-validated on a correction.
test.fixme('correcting a package whose member is locked', {
    annotation: [
        {type: 'confluence', description: '1328906312 blocker'}, // Correcting package with locked item
    ],
}, async () => {
    // Blocked by the product gap above.
});
