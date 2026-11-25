import {Browser, BrowserContext, Locator, Page, Request, Response, test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {MarkForUser, expectAvatarOf} from './page-object-models/mark-for-user';
import {getEmailedLink, getMailcrabMessageIds, loginAs, restoreDatabaseSnapshot} from './utils';
import {getSluglinesMarkedFor, getUnreadNotificationCount, markItemForUser} from './utils/archive-api';
import {getLoggedOutStorageState} from './utils/storage-state';

// The markForUser extension in the angular editor: `admin` (John Doe) acts, `samgamgee` is read from a second session.
// Where the product differs from the cases:
// - the notification, the email link and the "Marked for me" list open the item read-only, with Edit offered;
// - the "Marked for me" list shows the item's last update time, not its creation time;
// - a mark changed from the editor toolbar is stored at once, with nothing left to save;
// - the actions menu's "Unmark user" unmarks without the dialog (1311835671's page repeats the avatar case).

const ITEM = 'test sports story';
const SECOND_ITEM = 'story 2';
const ADMIN = {username: 'admin', displayName: 'John Doe', email: 'admin@example.com'};
const SAM = {username: 'samgamgee', displayName: 'Sam Gamgee', email: 'samgamgee@example.com'};
const ALL_USERS = ['John Doe', 'Frodo Baggins', 'Jane Doe', 'Sam Gamgee'];

// picked and discarded before the real choice, so it must differ from every user a test marks for
const DISCARDED_USER = 'Frodo Baggins';

const markedMessage = (slugline: string, forUser: string) =>
    `Item "${slugline}" has been marked for ${forUser} by ${ADMIN.displayName}.`;
const unmarkedMessage = (slugline: string) => `Item "${slugline}" has been unmarked by ${ADMIN.displayName}.`;

type Route = 'actions menu' | 'list avatar' | 'editor toolbar';

const isArchivePatch = (request: Request) => request.method() === 'PATCH' && /\/api\/archive\//.test(request.url());

async function openSportsMonitoring(page: Page): Promise<Monitoring> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    // Right after a restore the list can briefly come up empty; wait so a click does not race it.
    await expect(monitoring.getArticleLocator(ITEM)).toBeVisible();

    return monitoring;
}

async function openActionsMenuEntry(monitoring: Monitoring, item: Locator, label: string): Promise<void> {
    const menu = await monitoring.openArticleActionsMenu(item);

    // the entries' accessible names start with their icon glyph
    await menu.getByRole('button', {name: new RegExp(`${label}$`)}).click();
}

function getUnreadBadge(page: Page): Locator {
    // the badge has no test id, and the authoring sidebar reuses the same element id
    return page.locator('#unread-count').first();
}

async function expectItemOpenReadOnly(page: Page, slugline: string): Promise<void> {
    const topbar = page.getByTestId('authoring-topbar');

    await expect(page.getByTestId('authoring').getByTestId('field-slugline')).toHaveValue(slugline);
    await expect(topbar.getByRole('button', {name: 'Edit', exact: true})).toBeVisible();
    await expect(topbar.getByTestId('save')).toHaveCount(0);
}

async function expectMarkedForMeButtonLeftOfProfile(page: Page): Promise<void> {
    const markForUser = new MarkForUser(page);

    await expect(async () => {
        const button = await markForUser.getMarkedForMeButton().boundingBox();
        const profile = await page.getByTestId('my-profile').boundingBox();

        expect(button).not.toBeNull();
        expect(profile).not.toBeNull();
        expect(button!.x).toBeGreaterThan(page.viewportSize()!.width / 2);
        expect(button!.x + button!.width).toBeLessThanOrEqual(profile!.x);
        expect(button!.y).toBeLessThan(profile!.y + profile!.height);
        expect(profile!.y).toBeLessThan(button!.y + button!.height);
    }).toPass({timeout: 10000});
}

async function expectMarkedForMe(page: Page, sluglines: Array<string>): Promise<void> {
    const markForUser = new MarkForUser(page);

    await expect(markForUser.getMarkedForMeCount()).toHaveText(String(sluglines.length));

    if (sluglines.length === 0) {
        await expect(markForUser.getMarkedForMeButton()).toBeDisabled();
        return;
    }

    await markForUser.openMarkedForMe();
    await expect(markForUser.getMarkedForMeItems()).toHaveCount(sluglines.length);

    for (const slugline of sluglines) {
        await expect(markForUser.getMarkedForMeItems().filter({hasText: slugline})).toHaveCount(1);
    }

    await markForUser.getMarkedForMeButton().click();
    await expect(markForUser.getMarkedForMeItems()).toHaveCount(0);
}

async function expectNotified(page: Page, message: string, slugline: string): Promise<void> {
    await page.getByRole('button', {name: 'View notifications'}).click();

    const newest = page.getByTestId('notification-pane').getByTestId('notification').first();

    await expect(newest).toContainText(message);
    await newest.getByRole('button', {name: 'open item'}).click();
    await expectItemOpenReadOnly(page, slugline);
}

async function expectEmailLinkOpensItem(
    context: BrowserContext,
    page: Page,
    email: {to: string; subject: string; knownMessageIds: Set<string>},
    slugline: string,
): Promise<void> {
    const link = await getEmailedLink(page, email);
    const tab = await context.newPage();

    await tab.goto(link);
    await expectItemOpenReadOnly(tab, slugline);
    await tab.close();
}

async function withSam(browser: Browser, callback: (page: Page, context: BrowserContext) => Promise<void>) {
    const context = await browser.newContext({storageState: getLoggedOutStorageState()});

    // A context made from `browser` outlives a failed test, so it is closed here.
    try {
        const page = await context.newPage();

        await loginAs(page, SAM.username, SAM.username);
        await callback(page, context);
    } finally {
        await context.close();
    }
}

// Cancel and the close icon must both leave without sending the pick to the server.
async function expectDialogDiscards(
    page: Page,
    openDialog: () => Promise<void>,
    markedUser: string | null,
): Promise<void> {
    const markForUser = new MarkForUser(page);
    const patches: Array<string> = [];
    const recordPatch = (request: Request) => {
        if (isArchivePatch(request)) {
            patches.push(request.url());
        }
    };

    page.on('request', recordPatch);

    await openDialog();
    await expect(markForUser.getUserOptions()).toHaveCount(ALL_USERS.length);
    await expect(markForUser.getUserOptions()).toContainText(ALL_USERS);

    if (markedUser == null) {
        await expect(markForUser.getUnmarkButton()).toHaveCount(0);
    } else {
        await expect(markForUser.getUserSelect()).toContainText(markedUser);
        await expect(markForUser.getUnmarkButton()).toBeVisible();
    }

    await expect(markForUser.getConfirmButton()).toBeDisabled();
    await markForUser.chooseUser(DISCARDED_USER);
    await expect(markForUser.getConfirmButton()).toBeEnabled();
    await markForUser.getCancelButton().click();
    await expect(markForUser.getDialog()).toHaveCount(0);

    await openDialog();

    if (markedUser != null) {
        await expect(markForUser.getUserSelect()).toContainText(markedUser);
    }

    await markForUser.chooseUser(DISCARDED_USER);
    await markForUser.getCloseIcon().click();
    await expect(markForUser.getDialog()).toHaveCount(0);

    page.off('request', recordPatch);
    expect(patches).toEqual([]);
}

// Picking DISCARDED_USER first lets the confirmed pick also prove that the dialog keeps only one user.
async function confirmUser(page: Page, openDialog: () => Promise<void>, displayName: string, itemCount = 1) {
    const markForUser = new MarkForUser(page);
    let patched = 0;
    const countPatch = (response: Response) => {
        if (isArchivePatch(response.request()) && response.ok()) {
            patched++;
        }
    };

    page.on('response', countPatch);

    await openDialog();
    await markForUser.chooseUser(DISCARDED_USER);
    await markForUser.chooseUser(displayName);
    await expect(markForUser.getUserSelect()).not.toContainText(DISCARDED_USER);
    await markForUser.getConfirmButton().click();
    await expect(markForUser.getDialog()).toHaveCount(0);
    await expect.poll(() => patched).toBe(itemCount);

    page.off('response', countPatch);
}

async function unmarkThroughDialog(page: Page, avatar: Locator): Promise<void> {
    const markForUser = new MarkForUser(page);

    await avatar.click();
    await markForUser.collapseUserOptions();
    await markForUser.getUnmarkButton().click();
    await expect(markForUser.getDialog()).toHaveCount(0);
}

async function expectSamHasNothingYet(): Promise<void> {
    expect(await getSluglinesMarkedFor(SAM.username, ITEM)).toEqual([]);
    expect(await getUnreadNotificationCount(SAM.username)).toBe(0);
}

async function marksOneItemForSam(page: Page, browser: Browser) {
    await restoreDatabaseSnapshot();

    const monitoring = await openSportsMonitoring(page);
    const markForUser = new MarkForUser(page);
    const item = monitoring.getArticleLocator(ITEM);
    const openDialog = () => openActionsMenuEntry(monitoring, item, 'Mark for user');

    await expectDialogDiscards(page, openDialog, null);
    await expectSamHasNothingYet();

    const knownMessageIds = await getMailcrabMessageIds(page);

    await confirmUser(page, openDialog, SAM.displayName);
    await expectAvatarOf(markForUser.getListAvatar(item), SAM.displayName);

    await withSam(browser, async (samPage, samContext) => {
        await expectMarkedForMeButtonLeftOfProfile(samPage);
        await expect(getUnreadBadge(samPage)).toHaveText('1');
        await expectMarkedForMe(samPage, [ITEM]);
        await expectNotified(samPage, markedMessage(ITEM, SAM.displayName), ITEM);
        await expectEmailLinkOpensItem(samContext, samPage, {
            to: SAM.email,
            subject: markedMessage(ITEM, SAM.displayName),
            knownMessageIds,
        }, ITEM);
    });
}

async function marksTwoItemsForSam(page: Page, browser: Browser) {
    await restoreDatabaseSnapshot();

    const monitoring = await openSportsMonitoring(page);
    const markForUser = new MarkForUser(page);
    const items = [monitoring.getArticleLocator(ITEM), monitoring.getArticleLocator(SECOND_ITEM)];

    for (const item of items) {
        await monitoring.multiSelect(item);
    }

    const openDialog = () => monitoring.executeMultiAction('Mark for user');

    await expectDialogDiscards(page, openDialog, null);
    await expectSamHasNothingYet();

    const knownMessageIds = await getMailcrabMessageIds(page);

    await confirmUser(page, openDialog, SAM.displayName, items.length);

    for (const item of items) {
        await expectAvatarOf(markForUser.getListAvatar(item), SAM.displayName);
    }

    await withSam(browser, async (samPage, samContext) => {
        await expectMarkedForMeButtonLeftOfProfile(samPage);
        await expect(getUnreadBadge(samPage)).toHaveText('2');
        await expectMarkedForMe(samPage, [ITEM, SECOND_ITEM]);

        await samPage.getByRole('button', {name: 'View notifications'}).click();

        const notifications = samPage.getByTestId('notification-pane').getByTestId('notification');
        const secondItemNotification = notifications.filter({hasText: markedMessage(SECOND_ITEM, SAM.displayName)});

        await expect(notifications.filter({hasText: markedMessage(ITEM, SAM.displayName)})).toHaveCount(1);
        await expect(secondItemNotification).toHaveCount(1);
        await secondItemNotification.getByRole('button', {name: 'open item'}).click();
        await expectItemOpenReadOnly(samPage, SECOND_ITEM);

        for (const slugline of [ITEM, SECOND_ITEM]) {
            await expectEmailLinkOpensItem(samContext, samPage, {
                to: SAM.email,
                subject: markedMessage(slugline, SAM.displayName),
                knownMessageIds,
            }, slugline);
        }
    });
}

// The item starts marked for Sam; the dialog behind `route` moves the mark to the current user.
async function movesMarkFromSamToMe(
    page: Page,
    browser: Browser,
    context: BrowserContext,
    route: Route,
) {
    await restoreDatabaseSnapshot();
    await markItemForUser(ITEM, SAM.username);

    const monitoring = await openSportsMonitoring(page);
    const markForUser = new MarkForUser(page);
    const authoring = new Authoring(page);
    const item = monitoring.getArticleLocator(ITEM);
    const listAvatar = markForUser.getListAvatar(item);
    const editorAvatar = markForUser.getEditorAvatar();

    await expectAvatarOf(listAvatar, SAM.displayName);
    await expectMarkedForMeButtonLeftOfProfile(page);
    await expectMarkedForMe(page, []);

    let openDialog: () => Promise<void>;

    if (route === 'actions menu') {
        const menu = await monitoring.openArticleActionsMenu(item);

        await expect(menu.getByRole('button', {name: /Unmark user$/})).toBeVisible();
        await expect(menu.getByRole('button', {name: /Mark for other user$/})).toBeVisible();
        await monitoring.closeActionsMenu();

        openDialog = () => openActionsMenuEntry(monitoring, item, 'Mark for other user');
    } else if (route === 'list avatar') {
        openDialog = () => listAvatar.click();
    } else {
        await item.dblclick();
        await expectAvatarOf(editorAvatar, SAM.displayName);

        openDialog = () => editorAvatar.click();
    }

    await expectDialogDiscards(page, openDialog, SAM.displayName);

    expect(await getUnreadNotificationCount(ADMIN.username)).toBe(0);
    expect(await getUnreadNotificationCount(SAM.username)).toBe(1);

    const knownMessageIds = await getMailcrabMessageIds(page);

    await confirmUser(page, openDialog, ADMIN.displayName);

    if (route === 'editor toolbar') {
        await expectAvatarOf(editorAvatar, ADMIN.displayName);
        await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeDisabled();
        await expectAvatarOf(listAvatar, ADMIN.displayName);
        await authoring.close();
    }

    await expectAvatarOf(listAvatar, ADMIN.displayName);
    await expectMarkedForMe(page, [ITEM]);

    await expect(getUnreadBadge(page)).toHaveText('1');
    await expectNotified(page, markedMessage(ITEM, ADMIN.displayName), ITEM);
    await expectEmailLinkOpensItem(context, page, {
        to: ADMIN.email,
        subject: markedMessage(ITEM, ADMIN.displayName),
        knownMessageIds,
    }, ITEM);

    await withSam(browser, async (samPage, samContext) => {
        // the first notification is the one from marking the item for Sam before the test
        await expect(getUnreadBadge(samPage)).toHaveText('2');
        await expectNotified(samPage, markedMessage(ITEM, ADMIN.displayName), ITEM);
        await expectEmailLinkOpensItem(samContext, samPage, {
            to: SAM.email,
            subject: markedMessage(ITEM, ADMIN.displayName),
            knownMessageIds,
        }, ITEM);
    });

    if (route === 'actions menu') {
        return;
    }

    // the pages of these two routes also expect the dialog's Unmark button to unmark
    await authoring.close();

    if (route === 'editor toolbar') {
        await item.dblclick();
        await expectAvatarOf(editorAvatar, ADMIN.displayName);
        await unmarkThroughDialog(page, editorAvatar);
        await expect(editorAvatar).toHaveCount(0);
        await authoring.close();
    } else {
        await unmarkThroughDialog(page, listAvatar);
    }

    await expect(listAvatar).toHaveCount(0);
}

// The item starts marked for the current user, who unmarks it through `route`.
async function unmarksMe(page: Page, context: BrowserContext, route: Route) {
    await restoreDatabaseSnapshot();
    await markItemForUser(ITEM, ADMIN.username);

    const monitoring = await openSportsMonitoring(page);
    const markForUser = new MarkForUser(page);
    const item = monitoring.getArticleLocator(ITEM);

    await expectAvatarOf(markForUser.getListAvatar(item), ADMIN.displayName);
    await expectMarkedForMeButtonLeftOfProfile(page);
    await expectMarkedForMe(page, [ITEM]);

    // the one notification is the seeded mark
    await expect(getUnreadBadge(page)).toHaveText('1');

    if (route === 'editor toolbar') {
        await item.dblclick();
        await expectAvatarOf(markForUser.getEditorAvatar(), ADMIN.displayName);
    }

    const knownMessageIds = await getMailcrabMessageIds(page);

    if (route === 'actions menu') {
        await openActionsMenuEntry(monitoring, item, 'Unmark user');
    } else {
        const avatar = route === 'list avatar' ? markForUser.getListAvatar(item) : markForUser.getEditorAvatar();

        await expectDialogDiscards(page, () => avatar.click(), ADMIN.displayName);
        await unmarkThroughDialog(page, avatar);
    }

    if (route === 'editor toolbar') {
        await expect(markForUser.getEditorAvatar()).toHaveCount(0);
        await new Authoring(page).close();
    }

    await expect(markForUser.getListAvatar(item)).toHaveCount(0);
    await expectMarkedForMe(page, []);

    await expect(getUnreadBadge(page)).toHaveText('2');
    await expectNotified(page, unmarkedMessage(ITEM), ITEM);
    await expectEmailLinkOpensItem(context, page, {
        to: ADMIN.email,
        subject: unmarkedMessage(ITEM),
        knownMessageIds,
    }, ITEM);
}

test.describe('marking an item for a user', () => {
    // every test here logs a second user in
    test.describe.configure({timeout: 90000});

    test('marks one item for another user from its actions menu', {
        annotation: [
            // Mark a single item for user from the list view
            {type: 'confluence', description: '1311835658 complete'},
            // Item marked for me appears in the Marked for me list
            {type: 'confluence', description: '1319929328 complete'},
        ],
    }, async ({page, browser}) => {
        await marksOneItemForSam(page, browser);
    });

    test('marks several items for another user from the multi-action bar', {
        annotation: [
            // Mark multiple items for user from the list view
            {type: 'confluence', description: '1311835660 complete'},
            // Item marked for me appears in the Marked for me list
            {type: 'confluence', description: '1319929328 complete'},
        ],
    }, async ({page, browser}) => {
        await marksTwoItemsForSam(page, browser);
    });

    test('moves the mark from another user to me through the actions menu', {
        annotation: [
            // Mark item for other user from the list view via action menu
            {type: 'confluence', description: '1311835666 complete'},
            // Item marked for me appears in the Marked for me list
            {type: 'confluence', description: '1319929328 complete'},
        ],
    }, async ({page, browser, context}) => {
        await movesMarkFromSamToMe(page, browser, context, 'actions menu');
    });

    test('moves the mark from another user to me through the list avatar', {
        annotation: [
            // Mark item for other user from the list view via user avatar
            {type: 'confluence', description: '1311835663 complete'},
            // Item marked for me appears in the Marked for me list
            {type: 'confluence', description: '1319929328 complete'},
        ],
    }, async ({page, browser, context}) => {
        await movesMarkFromSamToMe(page, browser, context, 'list avatar');
    });

    test('moves the mark from another user to me through the editor toolbar', {
        annotation: [
            // Mark open item for other user via editor toolbar
            {type: 'confluence', description: '1311835685 complete'},
            // Item marked for me appears in the Marked for me list
            {type: 'confluence', description: '1319929328 complete'},
        ],
    }, async ({page, browser, context}) => {
        await movesMarkFromSamToMe(page, browser, context, 'editor toolbar');
    });
});

test.describe('unmarking an item marked for me', () => {
    // the email poll alone may take 20s, on top of several dialog round trips
    test.describe.configure({timeout: 60000});

    test('unmarks through the list avatar', {
        annotation: [
            // Unmark item from user in the list view via user avatar
            {type: 'confluence', description: '1311835668 complete'},
            // Item unmarked from me disappears from the Marked for me list
            {type: 'confluence', description: '1319929400 complete'},
        ],
    }, async ({page, context}) => {
        await unmarksMe(page, context, 'list avatar');
    });

    test('unmarks through the actions menu', {
        annotation: [
            // Unmark item from user in the list view via action menu
            {type: 'confluence', description: '1311835671 complete'},
            // Item unmarked from me disappears from the Marked for me list
            {type: 'confluence', description: '1319929400 complete'},
        ],
    }, async ({page, context}) => {
        await unmarksMe(page, context, 'actions menu');
    });

    test('unmarks through the editor toolbar', {
        annotation: [
            // Unmark open item from user via editor toolbar
            {type: 'confluence', description: '1311835683 complete'},
            // Item unmarked from me disappears from the Marked for me list
            {type: 'confluence', description: '1319929400 complete'},
        ],
    }, async ({page, context}) => {
        await unmarksMe(page, context, 'editor toolbar');
    });
});

test('lists the items marked for me by desk from the top bar', {
    annotation: [
        // Show content Marked for me
        {type: 'confluence', description: '1319929326 complete'},
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const marked = [
        {desk: 'Sports', slugline: ITEM, ...await markItemForUser(ITEM, ADMIN.username)},
        {desk: 'Finance', slugline: 'Finances Story', ...await markItemForUser('Finances Story', ADMIN.username)},
    ];

    const markForUser = new MarkForUser(page);

    for (const route of ['/#/workspace/monitoring', '/#/search', '/#/workspace/personal', '/#/settings/templates']) {
        await page.goto(route);
        await expect(markForUser.getMarkedForMeCount()).toHaveText('2');
    }

    await expectMarkedForMeButtonLeftOfProfile(page);
    await markForUser.openMarkedForMe();

    const groups = markForUser.getMarkedForMeGroups();

    await expect(groups).toHaveCount(marked.length);

    for (const {desk, slugline, firstcreated, versioncreated} of marked) {
        const group = groups.filter({hasText: new RegExp(`^1${desk}`)});
        const label = markForUser.getMarkedForMeGroupLabel(group);
        const listed = group.getByTestId('item');

        await expect(label).toHaveText(`1${desk}`);
        await expect(label.getByTestId('badge')).toHaveText('1');
        await expect(listed).toHaveCount(1);
        await expect(listed.getByTestId('field--slugline')).toHaveText(slugline);
        await expect(listed.getByTestId('type-icon')).toHaveAttribute('data-test-value', 'text');
        await expect(listed).toContainText('In Progress');

        // the mark itself bumps `versioncreated`, years after `firstcreated`, so the two cannot be confused
        expect(Date.parse(versioncreated) - Date.parse(firstcreated)).toBeGreaterThan(24 * 60 * 60 * 1000);

        const shownTime = Date.parse(await listed.locator('time').getAttribute('title') ?? '');

        // the title is the long format, precise to the minute, in the browser's time zone
        expect(Math.abs(shownTime - Date.parse(versioncreated))).toBeLessThan(60 * 1000);
    }

    await groups.filter({hasText: 'Finances Story'}).getByTestId('item').click();
    await expectItemOpenReadOnly(page, 'Finances Story');
});
