import {Locator, Page, test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {loginAs, restoreDatabaseSnapshot} from './utils';
import {getLoggedOutStorageState} from './utils/storage-state';

/**
 * QA case "Lock item". The observer has to be a different user: a second session of
 * the lock owner always gets Unlock, because `LockService.can_unlock` returns true for
 * the owner's own user id before it looks at the `unlock` privilege. `samgamgee`
 * (Sub Editor role, no `unlock`) is the negative branch, `admin` the positive one.
 *
 * The case puts the lock owner's name behind a click on their avatar; the product
 * renders the avatar, "Locked by" and the name inline in the topbar's `locked-info`.
 */
test.describe('locking an item that is open for editing', {
    annotation: [
        {type: 'confluence', description: '1308524847 complete'}, // Lock item
    ],
}, () => {
    const ARTICLE = 'test sports story';
    const SECOND_USER = {username: 'samgamgee', password: 'samgamgee', displayName: 'Sam Gamgee', initials: 'SG'};
    const ADMIN = {displayName: 'John Doe', initials: 'JD'};

    // headline, slugline and editors-note carry `field-*` test ids instead of `authoring-field`
    const FIELDS = '[data-test-id="authoring-field"], [data-test-id^="field-"]';

    async function openSportsMonitoring(page: Page): Promise<{monitoring: Monitoring, item: Locator}> {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const item = monitoring.getArticleLocator(ARTICLE);

        // The post-restore reindex briefly empties the list; wait so a click does not race it.
        await expect(item).toBeVisible();

        return {monitoring, item};
    }

    async function lockForEditing(page: Page): Promise<void> {
        const {item} = await openSportsMonitoring(page);

        await item.dblclick();

        await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeVisible();
        await expect(item.getByTestId('article-item-locked')).toHaveCount(1);
    }

    function fieldIds(page: Page): Promise<Array<string>> {
        return page.getByTestId('authoring').locator(FIELDS).evaluateAll((fields) => fields.map(
            (field) => `${field.getAttribute('data-test-id')}=${field.getAttribute('data-test-value') ?? ''}`,
        ));
    }

    async function expectReadOnly(page: Page): Promise<void> {
        const authoring = page.getByTestId('authoring');
        const fields = authoring.locator(FIELDS);
        const field = (id: string) =>
            authoring.getByTestId('authoring-field').and(page.locator(`[data-test-value="${id}"]`));

        await expect(authoring).toBeVisible();

        await expect(authoring.getByTestId('field--headline')).toContainText(ARTICLE);
        await expect(field('body_html')).toContainText('test sport story body');
        await expect(authoring.getByTestId('field-slugline')).toHaveValue(ARTICLE);
        await expect(field('priority')).toContainText('6');
        await expect(field('urgency')).toContainText('3');

        await expect(authoring.getByTestId('field--headline').getByTestId('editor3').locator('[contenteditable]'))
            .toHaveAttribute('contenteditable', 'false');
        await expect(field('body_html').getByTestId('editor3').locator('[contenteditable]'))
            .toHaveAttribute('contenteditable', 'false');
        await expect(fields.locator('[contenteditable="true"]')).toHaveCount(0);
        await expect(authoring.getByTestId('field-slugline')).toBeDisabled();
        await expect(authoring.getByTestId('field-editors-note')).toBeDisabled();
        await expect(field('priority').getByRole('button')).toBeDisabled();
        await expect(field('urgency').getByRole('button')).toBeDisabled();
        await expect(field('feature_media').getByTestId('upload-placeholder')).toHaveCount(0);

        const topbar = page.getByTestId('authoring-topbar');

        await expect(topbar.getByTestId('save')).toHaveCount(0);
        await expect(topbar.getByTestId('close')).toBeVisible();
    }

    test('a user without the Unlock content privilege only gets it read-only', async ({page, browser}) => {
        await restoreDatabaseSnapshot();

        await lockForEditing(page);

        const ownerFields = await fieldIds(page);

        expect(ownerFields.length).toBeGreaterThan(0);

        const observerContext = await browser.newContext({storageState: getLoggedOutStorageState()});

        // A context made from `browser` outlives a failed test, and its open authoring page
        // would keep autosaving into the database the next spec restores.
        try {
            const observer = await observerContext.newPage();

            await loginAs(observer, SECOND_USER.username, SECOND_USER.password);

            const {monitoring, item} = await openSportsMonitoring(observer);

            await expect(item.getByTestId('article-item-locked')).toHaveCount(1);

            const actionsMenu = await monitoring.openArticleActionsMenu(item);

            await expect(actionsMenu.getByRole('button', {name: 'Open', exact: true})).toBeVisible();
            await expect(actionsMenu.getByRole('button', {name: 'Open in new Window', exact: true})).toBeVisible();
            await expect(actionsMenu.getByRole('button', {name: 'Edit', exact: true})).toHaveCount(0);

            await actionsMenu.getByRole('button', {name: 'Open', exact: true}).click();

            await expectReadOnly(observer);
            await expect.poll(() => fieldIds(observer)).toEqual(ownerFields);

            const topbar = observer.getByTestId('authoring-topbar');
            const lockedInfo = topbar.getByTestId('locked-info');

            await expect(lockedInfo.getByTestId('user-avatar')).toHaveText(ADMIN.initials);
            await expect(lockedInfo.getByTitle(ADMIN.displayName)).toBeVisible();
            await expect(lockedInfo).toContainText(`Locked by ${ADMIN.displayName}`);

            // The button stays in the DOM behind ng-show, so check visibility rather than count.
            await expect(lockedInfo.getByTestId('unlock')).toBeHidden();

            await topbar.getByTestId('close').click();
            await expect(observer.getByTestId('authoring')).toHaveCount(0);

            await item.dblclick();
            await expectReadOnly(observer);
            await expect(lockedInfo).toContainText(`Locked by ${ADMIN.displayName}`);
            await expect(lockedInfo.getByTestId('unlock')).toBeHidden();
        } finally {
            await observerContext.close();
        }
    });

    test('a user with the Unlock content privilege can unlock it', async ({page, browser}) => {
        await restoreDatabaseSnapshot();

        const ownerContext = await browser.newContext({storageState: getLoggedOutStorageState()});

        try {
            const owner = await ownerContext.newPage();

            await loginAs(owner, SECOND_USER.username, SECOND_USER.password);
            await lockForEditing(owner);

            const {item} = await openSportsMonitoring(page);

            await expect(item.getByTestId('article-item-locked')).toHaveCount(1);

            await item.dblclick();
            await expectReadOnly(page);

            const topbar = page.getByTestId('authoring-topbar');
            const lockedInfo = topbar.getByTestId('locked-info');

            await expect(lockedInfo.getByTestId('user-avatar')).toHaveText(SECOND_USER.initials);
            await expect(lockedInfo).toContainText(`Locked by ${SECOND_USER.displayName}`);
            await expect(lockedInfo.getByTestId('unlock')).toBeVisible();

            await lockedInfo.getByTestId('unlock').click();

            // Unlocking reopens the item for editing, so the lock moves to the unlocking user.
            await expect(topbar.getByTestId('save')).toBeVisible();
            await expect(topbar.getByTestId('locked-info')).toHaveCount(0);
            await expect(page.getByTestId('authoring').getByTestId('field--headline').locator('[contenteditable]'))
                .toHaveAttribute('contenteditable', 'true');

            const dialog = owner.getByTestId('modal-confirm');

            await expect(dialog).toContainText(`Item ${ARTICLE} was unlocked by ${ADMIN.displayName}.`);
        } finally {
            await ownerContext.close();
        }
    });
});
