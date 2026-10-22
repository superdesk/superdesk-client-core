import {test, expect, Page, Response} from '@playwright/test';
import {PackageAuthoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

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
    await monitoring.executeActionOnMonitoringItem(monitoring.getGroupedArticleLocator(WORKING_STAGE, name), 'Edit');
    await expect(authoring.fieldContainer('groups')).toBeVisible();

    return {monitoring, authoring};
}

async function reopen(page: Page): Promise<void> {
    await openPackage(page);
}

async function save(page: Page): Promise<{request: any; response: any}> {
    const saved = page.waitForResponse(
        (r: Response) => r.request().method() === 'PATCH' && r.url().includes('/api/archive/'),
    );

    await page.getByRole('button', {name: 'Save', exact: true}).click();

    const response = await saved;

    expect(response.ok()).toBe(true);

    return {request: response.request().postDataJSON(), response: await response.json()};
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

        const {request, response} = await save(page);

        expect(groupIds(request.groups)).toEqual(['root', 'main', 'story']);
        expect(request.groups[0].refs).toEqual([{idRef: 'main', label: 'main'}, {idRef: 'story', label: 'story'}]);
        expect(groupIds(response.groups)).toEqual(['root', 'main', 'story']);

        await reopen(page);

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

        const {request} = await save(page);

        expect(request.headline).toBe('Fellowship package, updated');
        expect(request).not.toHaveProperty('groups');
    });

    test('adds an item to the chosen group with "Add to current"', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {monitoring, authoring} = await openPackage(page);
        const item = monitoring.getGroupedArticleLocator(WORKING_STAGE, 'test sports story');

        await monitoring.executeSubmenuAction(
            item,
            'Add to current',
            'story',
            {innerByTestId: 'add-to-package-group=story'},
        );

        await expect(authoring.groupItems('story')).toHaveCount(2);
        await expect(authoring.groupItems('story').first()).toHaveAttribute('data-test-value', 'test sports story');

        // offered only for items that are not in the package, including ones added since it was opened
        await item.hover();
        await item.getByTestId('context-menu-button').click();
        await expect(page.getByTestId('context-menu').getByRole('button', {name: 'Edit', exact: true})).toBeVisible();
        await expect(page.getByTestId('context-menu').getByRole('button', {name: 'Add to current'})).toHaveCount(0);
        await page.keyboard.press('Escape');

        const {request} = await save(page);

        expect(request.groups[2].refs[0].residRef).toBe(await item.evaluate((element) => element.id));

        await reopen(page);
        await expect(authoring.groupItems('story').first()).toHaveAttribute('data-test-value', 'test sports story');
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
        await monitoring.multiSelect(monitoring.getGroupedArticleLocator(WORKING_STAGE, 'story 2'));
        await monitoring.executeMultiAction('Add to Current Package');

        await expect(page.getByText('Item is already in this package.')).toBeVisible();
        await expect(authoring.groupItems('main')).toHaveCount(3);
        await expect(authoring.groupItems('story')).toHaveCount(1);
        await expect(authoring.item('story 2')).toBeVisible();
    });

    test('sets a story label on an item', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {authoring} = await openPackage(page);

        await authoring.item('Bywater notice').getByTestId('package-item-actions').getByRole('button').click();
        await page.getByRole('menuitem', {name: 'Set label'}).hover();
        await page.getByRole('menuitem', {name: 'Featured'}).click();

        const label = authoring.item('Bywater notice').getByTestId('package-item-label');

        await expect(label).toHaveText('label: Featured');

        const {request} = await save(page);

        expect(request.groups[2].refs[0].label).toBe('story-label:featured');

        await reopen(page);
        await expect(label).toHaveText('label: Featured');
    });
});

test.describe('published package (authoring-react)', () => {
    // "Package Highlight 1" holds "Story 3". It is on the Story profile, which requires nothing to publish.
    test('shows the items read-only once the package is published', async ({page}) => {
        await restoreDatabaseSnapshot();

        const {monitoring, authoring} = await openPackage(page, 'Package Highlight 1');

        await page.getByTestId('authoring').getByTestId('open-send-publish-pane').click();

        const publishButton = page.getByTestId('panel-footer').getByTestId('publish');

        // A click made while the panel is still loading is sometimes lost (not specific to packages).
        // Publishing closes the item, so a click is repeated only while it is open.
        await expect(async () => {
            if (await publishButton.isVisible()) {
                await publishButton.click();
            }

            await expect(page.getByTestId('authoring')).toBeHidden({timeout: 5000});
        }).toPass({timeout: 30000});

        const published = monitoring.getGroupedArticleLocator('Sports desk output', 'Package Highlight 1');

        await expect(published).toBeVisible();
        await monitoring.executeActionOnMonitoringItem(published, 'Open');

        await expect(authoring.item('Story 3').getByTestId('package-item-state'))
            .toHaveAttribute('data-test-value', 'published');
        await expect(authoring.fieldContainer('groups').getByTestId('package-item-drag-handle')).toHaveCount(0);
        await expect(authoring.fieldContainer('groups').getByTestId('package-item-remove')).toHaveCount(0);
    });
});

// the header fills the default viewport and pushes the items out of the pointer's reach
test.describe('package items drag and drop (authoring-react)', () => {
    test.use({viewport: {width: 1280, height: 1400}});

    test('moves an item to another group by dragging it', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'packages'});

        const {authoring} = await openPackage(page);

        await authoring.dragItemBefore('Bywater notice', 'Hobbiton notice');

        await expect(authoring.groupItems('main')).toHaveCount(3);
        await expect(authoring.groupItems('main').first()).toHaveAttribute('data-test-value', 'Bywater notice');
        await expect(authoring.groupItems('story')).toHaveCount(0);
        await expect(authoring.group('story').getByTestId('package-group-empty')).toBeVisible();

        const {request} = await save(page);

        expect(groupIds(request.groups)).toEqual(['root', 'main', 'story']);
        expect(request.groups[2].refs).toEqual([]);

        await reopen(page);

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

        const {request} = await save(page);

        expect(request.slugline).toBe('Fellowship');

        await reopen(page);
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
