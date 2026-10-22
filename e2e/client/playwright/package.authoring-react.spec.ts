import {test, expect, Page} from '@playwright/test';
import {PackageAuthoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {login, restoreDatabaseSnapshot} from './utils';
import {getLoggedOutStorageState, getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

// "Fellowship package" holds "Hobbiton notice" and "Buckland notice" in `main`, "Bywater notice" in `story`
const PACKAGE = 'Fellowship package';
const WORKING_STAGE = 'Sports / Working Stage';

async function openPackage(page: Page, name = PACKAGE): Promise<{monitoring: Monitoring; authoring: PackageAuthoring}> {
    const monitoring = new Monitoring(page);
    const authoring = new PackageAuthoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    const row = monitoring.getGroupedArticleLocator(WORKING_STAGE, name);

    await monitoring.executeActionOnMonitoringItem(row, 'Edit');
    await expect(authoring.fieldContainer('groups')).toBeVisible();

    // the list re-renders its rows once it learns of the lock, which closes any menu open on them
    await expect(row.getByTestId('article-item-locked')).toBeVisible();

    return {monitoring, authoring};
}

async function reopen(page: Page, authoring: PackageAuthoring): Promise<void> {
    const monitoring = new Monitoring(page);
    const row = monitoring.getGroupedArticleLocator(WORKING_STAGE, PACKAGE);

    await authoring.close();

    // saving re-sorts the list and closing unlocks the package; each re-renders the rows and closes open menus
    await expect(row.getByTestId('article-item-locked')).toHaveCount(0);
    await expect(monitoring.getGroupedArticlesLocator(WORKING_STAGE).first())
        .toHaveAttribute('data-test-value', PACKAGE);

    await openPackage(page);
}

function groupIds(groups: Array<{id: string}>): Array<string> {
    return groups.map(({id}) => id);
}

test.describe('package (authoring-react)', () => {
    test('shows every group and keeps them all when one of them changes', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {authoring} = await openPackage(page);

        await expect(authoring.groupItems('main')).toHaveCount(2);
        await expect(authoring.groupItems('story')).toHaveCount(1);
        await expect(authoring.group('story').getByTestId('package-group-title')).toHaveText('story');

        await authoring.item('Buckland notice').getByTestId('package-item-remove').getByRole('button').click();
        await expect(authoring.groupItems('main')).toHaveCount(1);

        const {request, response} = await authoring.saveAndGetRequest();

        expect(groupIds(request.groups)).toEqual(['root', 'main', 'story']);
        expect(request.groups[0].refs).toEqual([{idRef: 'main', label: 'main'}, {idRef: 'story', label: 'story'}]);
        expect(groupIds(response.groups)).toEqual(['root', 'main', 'story']);

        await reopen(page, authoring);

        await expect(authoring.groupItems('main')).toHaveCount(1);
        await expect(authoring.item('Hobbiton notice')).toBeVisible();
        await expect(authoring.groupItems('story')).toHaveCount(1);
        await expect(authoring.item('Bywater notice')).toBeVisible();
    });

    test('does not send the groups when only another field changed', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {authoring} = await openPackage(page);

        await authoring.waitForAuthoringReactToInitialize();
        await authoring.replaceEditor3FieldText(
            authoring.fieldContainer('headline').getByRole('textbox'),
            'Fellowship package, updated',
        );

        const {request} = await authoring.saveAndGetRequest();

        expect(request.headline).toBe('Fellowship package, updated');
        expect(request).not.toHaveProperty('groups');
    });

    test('adds an item to the chosen group with "Add to current"', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {monitoring, authoring} = await openPackage(page);

        await monitoring.executeSubmenuAction(
            monitoring.getGroupedArticleLocator(WORKING_STAGE, 'test sports story'),
            'Add to current',
            'story',
            {innerByTestId: 'add-to-package-group=story'},
        );

        await expect(authoring.groupItems('story')).toHaveCount(2);
        await expect(authoring.groupItems('story').first()).toHaveAttribute('data-test-value', 'test sports story');

        await authoring.saveAndGetRequest();
        await reopen(page, authoring);

        await expect(authoring.groupItems('story')).toHaveCount(2);
        await expect(authoring.groupItems('story').first()).toHaveAttribute('data-test-value', 'test sports story');
    });

    test('stops offering "Add to current" for an item once it is added', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {monitoring, authoring} = await openPackage(page);
        const item = monitoring.getGroupedArticleLocator(WORKING_STAGE, 'test sports story');

        await monitoring.executeSubmenuAction(
            item,
            'Add to current',
            'story',
            {innerByTestId: 'add-to-package-group=story'},
        );
        await expect(authoring.item('test sports story')).toBeVisible();

        const contextMenu = await monitoring.openContextMenu(item);

        // the menu renders its actions together, so a visible Edit means the list is complete
        await expect(contextMenu.getByRole('button', {name: 'Edit', exact: true})).toBeVisible();
        await expect(contextMenu.getByRole('button', {name: 'Add to current'})).toHaveCount(0);
    });

    test('adds the selected items to the main group with "Add to Current Package"', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {monitoring, authoring} = await openPackage(page);

        await monitoring.multiSelect(monitoring.getGroupedArticleLocator(WORKING_STAGE, 'test sports story'));
        await monitoring.multiSelect(monitoring.getGroupedArticleLocator(WORKING_STAGE, 'story 2'));
        await monitoring.executeMultiAction('Add to Current Package');

        await expect(authoring.groupItems('main')).toHaveCount(4);
        await expect(authoring.item('test sports story')).toBeVisible();
        await expect(authoring.item('story 2')).toBeVisible();
        await expect(authoring.groupItems('story')).toHaveCount(1);
    });

    test('refuses an item that is in the package already', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {monitoring, authoring} = await openPackage(page);

        await monitoring.multiSelect(monitoring.getGroupedArticleLocator(WORKING_STAGE, 'Bywater notice'));
        await monitoring.executeMultiAction('Add to Current Package');

        await expect(page.getByText('Item is already in this package.')).toBeVisible();
        await expect(authoring.groupItems('main')).toHaveCount(2);
        await expect(authoring.groupItems('story')).toHaveCount(1);
    });

    test('sets a story label on an item', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {authoring} = await openPackage(page);

        await authoring.item('Bywater notice').getByTestId('package-item-actions').getByRole('button').click();
        await page.getByRole('menuitem', {name: 'Set label'}).hover();
        await page.getByRole('menuitem', {name: 'Featured'}).click();

        const label = authoring.item('Bywater notice').getByTestId('package-item-label');

        await expect(label).toHaveText('label: Featured');

        const {request} = await authoring.saveAndGetRequest();

        expect(request.groups[2].refs[0].label).toBe('story-label:featured');

        await reopen(page, authoring);
        await expect(label).toHaveText('label: Featured');
    });
});

test.describe('published package (authoring-react)', () => {
    // "Package Highlight 1" holds "Story 3". It is on the Story profile, which requires nothing to publish.
    test('shows the items read-only once the package is published', async ({page}) => {
        await restoreDatabaseSnapshot();

        const {monitoring, authoring} = await openPackage(page, 'Package Highlight 1');

        await authoring.publish({subscribers: []});
        await expect(page.getByTestId('authoring')).toBeHidden();

        const published = monitoring.getGroupedArticleLocator('Sports desk output', 'Package Highlight 1');

        await expect(published).toBeVisible();
        await monitoring.executeActionOnMonitoringItem(published, 'Open');

        await expect(authoring.item('Story 3').getByTestId('package-item-state'))
            .toHaveAttribute('data-test-value', 'published');
        await expect(authoring.fieldContainer('groups').getByTestId('package-item-drag-handle')).toHaveCount(0);
        await expect(authoring.fieldContainer('groups').getByTestId('package-item-remove')).toHaveCount(0);
    });
});

test.describe('package items drag and drop (authoring-react)', () => {
    test('moves an item to another group by dragging it', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {authoring} = await openPackage(page);

        await authoring.dragItemBefore('Bywater notice', 'Hobbiton notice');

        await expect(authoring.groupItems('main')).toHaveCount(3);
        await expect(authoring.groupItems('main').first()).toHaveAttribute('data-test-value', 'Bywater notice');
        await expect(authoring.groupItems('story')).toHaveCount(0);
        await expect(authoring.group('story').getByTestId('package-group-empty')).toBeVisible();

        const {request} = await authoring.saveAndGetRequest();

        expect(groupIds(request.groups)).toEqual(['root', 'main', 'story']);
        expect(request.groups[2].refs).toEqual([]);

        await reopen(page, authoring);

        await expect(authoring.groupItems('main').first()).toHaveAttribute('data-test-value', 'Bywater notice');
        await expect(authoring.groupItems('story')).toHaveCount(0);
    });

    test('reorders items within a group by dragging them', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {authoring} = await openPackage(page);

        await authoring.dragItemBefore('Buckland notice', 'Hobbiton notice');

        await expect(authoring.groupItems('main').first()).toHaveAttribute('data-test-value', 'Buckland notice');
        await expect(authoring.groupItems('main').last()).toHaveAttribute('data-test-value', 'Hobbiton notice');
    });
});

test.describe('package header (authoring-react)', () => {
    test('shows the fields of the package profile and saves them', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {authoring} = await openPackage(page);

        await expect(authoring.fieldContainer('slugline')).toBeVisible();
        await expect(authoring.fieldContainer('anpa_category')).toBeVisible();
        await expect(authoring.fieldContainer('headline')).toBeVisible();
        await expect(page.getByTestId('content-profile-select')).toHaveCount(0);

        await authoring.waitForAuthoringReactToInitialize();
        await authoring.replaceEditor3FieldText(
            authoring.fieldContainer('slugline').getByRole('textbox'),
            'Fellowship',
        );

        const {request} = await authoring.saveAndGetRequest();

        expect(request.slugline).toBe('Fellowship');

        await reopen(page, authoring);
        await expect(authoring.fieldContainer('slugline').getByRole('textbox')).toHaveText('Fellowship');
    });

    // "Package Highlight 1" is on the Story profile
    test('uses the package profile for a package that is on a text profile', async ({page}) => {
        await restoreDatabaseSnapshot();

        const {authoring} = await openPackage(page, 'Package Highlight 1');

        await expect(authoring.fieldContainer('slugline')).toBeVisible();
        await expect(authoring.fieldContainer('body_html')).toHaveCount(0);
        await expect(page.getByTestId('content-profile-select')).toHaveCount(0);
    });
});

test.describe('after logging in through the login page (authoring-react)', () => {
    test.use({storageState: getLoggedOutStorageState({authoringReact: true})});

    // the subject field lists subject codes, which the app loads once a session starts
    test('shows the subject field', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});
        await login(page);

        const {authoring} = await openPackage(page);

        await expect(authoring.fieldContainer('subject').getByTestId('authoring-field-input')).toBeVisible();
    });
});
