import {test, expect, Locator, Page} from '@playwright/test';
import {PackageAuthoring} from './page-object-models/authoring';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {DeskSettings} from './page-object-models/settings/desks';
import {getCellValueByColumTitle, restoreDatabaseSnapshot, waitForToastMessage} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';
import {editArticle} from './scenarios/authoring-react-article';
import {TreeSelectDriver} from './utils/tree-select-driver';

/**
 * QA publishing cases driven from the authoring-react editor: publish an article, the publish queue,
 * embargo, scheduled publishing, publishing a package and the desk-type gate on the Publish tab.
 * The send / publish panel itself is shared with angular; what differs is how authoring-react
 * opens it, saves before sending and closes afterwards.
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});

// several tests drive more than one publish through the editor
test.setTimeout(90000);

const SPORTS_OUTPUT = 'Sports desk output';
const WORKING_STAGE = 'Sports / Working Stage';

async function openForEditing(
    page: Page,
    label: string,
    snapshotName?: string,
): Promise<{monitoring: Monitoring; authoring: AuthoringReact}> {
    await restoreDatabaseSnapshot({snapshotName});

    return editArticle(page, label);
}

function pad(value: number): string {
    return value.toString().padStart(2, '0');
}

function inTwoDaysAtTen(): Date {
    const when = new Date();

    when.setDate(when.getDate() + 2);
    when.setHours(10, 0, 0, 0);

    return when;
}

/**
 * Fills one of the panel's date + time pickers. The date format is only exposed as the input
 * placeholder; primereact's Calendar ignores `input` events without a keydown, so the date is typed
 * key by key; a keystroke can be dropped while the picker re-renders, so it is retried as a unit.
 */
async function fillDateTime(section: Locator, when: Date): Promise<string> {
    const dateInput = section.getByTestId('date-input');
    const timeInput = section.getByTestId('time-input');
    const placeholder = await dateInput.getAttribute('placeholder');

    if (placeholder == null) {
        throw new Error('the date input has no placeholder to read the date format from');
    }

    const date = placeholder
        .replace('dd', pad(when.getDate()))
        .replace('mm', pad(when.getMonth() + 1))
        .replace('yyyy', when.getFullYear().toString());
    const time = `${pad(when.getHours())}:${pad(when.getMinutes())}`;

    await expect(async () => {
        await dateInput.clear();
        await dateInput.pressSequentially(date);
        await dateInput.press('Escape');
        await timeInput.fill(time);

        await expect(dateInput).toHaveValue(date, {timeout: 2000});
        await expect(timeInput).toHaveValue(time, {timeout: 2000});
    }).toPass({timeout: 30000});

    return date;
}

/**
 * Changes made in the panel (a schedule, targeted subscribers) count as unsaved changes. authoring-react
 * asks with its own "Save changes?" prompt (Ignore / Cancel / Save) where angular offers "save and send".
 */
function saveChangesPrompt(page: Page): Locator {
    return page.getByTestId('unsaved-changes-dialog');
}

test.describe('publishing from authoring-react', () => {
    test('publishes an article to its desk output and closes the editor', {
        annotation: [
            {type: 'confluence', description: '1308524957 partial'}, // Publish article
        ],
    }, async ({page}) => {
        const {monitoring, authoring} = await openForEditing(page, 'story 2');

        await expect(monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'story 2')).toHaveCount(0);

        const panel = await authoring.openActionsPanel('Publish');

        await panel.getByTestId('publish').click();

        await expect(authoring.root).toBeHidden();
        await expect(monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'story 2')).toBeVisible();
        await expect(monitoring.getGroupedArticleLocator(WORKING_STAGE, 'story 2')).toHaveCount(0);
    });

    test('a publish targeted at one subscriber shows up in the publish queue for it', {
        annotation: [
            {type: 'confluence', description: '1311834383 partial'}, // Publish Queue (Nareg)
            {type: 'confluence', description: '1344443868 complete'}, // Check Publish Queue (Nareg)
        ],
    }, async ({page}) => {
        const {monitoring, authoring} = await openForEditing(page, 'test sports story');
        const panel = await authoring.openActionsPanel('Publish');

        await new TreeSelectDriver(page, panel.getByTestId('target-subscribers')).setValues(['Subscriber 1']);

        const publishRequest = page.waitForRequest(
            (r) => r.method() === 'PATCH' && r.url().includes('/api/archive/publish/'),
        );

        await panel.getByTestId('publish').click();
        await saveChangesPrompt(page).getByRole('button', {name: 'Save', exact: true}).click();

        // the queue below would look the same if the target were dropped and every matching subscriber got the item
        expect((await publishRequest).postDataJSON().target_subscribers).toEqual([
            expect.objectContaining({name: 'Subscriber 1'}),
        ]);

        await expect(authoring.root).toBeHidden();

        await expect(monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'test sports story')).toBeVisible();

        await page.goto('/#/publish_queue');

        const queueItem = page.getByTestId('publish-queue-item')
            .and(page.locator('[data-test-value="test sports story"]'));

        await expect(queueItem).toHaveCount(1);

        expect(await getCellValueByColumTitle(page.getByTestId('publish-queue-table'), queueItem, 'Subscriber'))
            .toBe('Subscriber 1');

        await queueItem.click();
        await expect(page.getByTestId('authoring-preview').getByTestId('field--headline'))
            .toHaveText('test sports story');
    });

    test('an embargo set in the panel is saved with the article and labelled in the list and Info widget', {
        annotation: [
            {type: 'confluence', description: '1308524955 partial'}, // Set embargo (Nareg)
            {type: 'confluence', description: '1344443874 complete'}, // Setting embargo
        ],
    }, async ({page}) => {
        const {monitoring, authoring} = await openForEditing(page, 'test sports story');
        const listItem = monitoring.getGroupedArticleLocator(WORKING_STAGE, 'test sports story');

        await expect(listItem).not.toContainText('Embargo');

        const panel = await authoring.openActionsPanel('Publish');
        const nextYear = new Date();

        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear.setHours(4, 0, 0, 0);

        await fillDateTime(panel.getByTestId('embargo'), nextYear);
        await panel.getByTestId('close').click();
        await expect(panel).toBeHidden();

        const {request} = await authoring.saveAndGetRequest();

        expect(request.embargo).toBeTruthy();

        await expect(listItem).toContainText('Embargo');

        const widget = await authoring.openWidgetByIcon('metadata');

        await expect(widget.getByText('embargo', {exact: true})).toBeVisible();
    });
});

test.describe('scheduled publishing from authoring-react', () => {
    test('the publish schedule fields take a date and a time and can be cleared', {
        annotation: [
            {type: 'confluence', description: '1308524953 partial'}, // Schedule publishing (Nareg)
        ],
    }, async ({page}) => {
        const {authoring} = await openForEditing(page, 'test sports story');
        const panel = await authoring.openActionsPanel('Publish');
        const section = panel.getByTestId('publish-schedule');

        await fillDateTime(section, inTwoDaysAtTen());
        await section.getByRole('button', {name: 'Clear'}).click();

        await expect(section.getByTestId('date-input')).toHaveValue('');
        await expect(section.getByTestId('time-input')).toHaveValue('');
    });

    test('a scheduled publish is refused while a required field is empty', {
        annotation: [
            {type: 'confluence', description: '1308524953 partial'}, // Schedule publishing (Nareg)
        ],
    }, async ({page}) => {
        // `required-headline` requires a headline, which "story 2" lacks
        const {monitoring, authoring} = await openForEditing(page, 'story 2', 'required-headline');
        const panel = await authoring.openActionsPanel('Publish');

        await fillDateTime(panel.getByTestId('publish-schedule'), inTwoDaysAtTen());
        await panel.getByTestId('publish').click();
        await saveChangesPrompt(page).getByRole('button', {name: 'Save', exact: true}).click();

        await waitForToastMessage(page, 'error', 'HEADLINE empty values not allowed');
        await expect(authoring.root).toBeVisible();
        await expect(page.getByTestId('monitoring-group').and(page.locator(`[data-test-value="${SPORTS_OUTPUT}"]`)))
            .toBeVisible();
        await expect(monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'story 2')).toHaveCount(0);

        await panel.getByTestId('close').click();
        await setEditor3FieldValue(authoring.input('headline'), 'Edoras at dawn');
        await authoring.saveAndGetRequest();

        await (await authoring.openActionsPanel('Publish')).getByTestId('publish').click();

        const scheduled = monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'Edoras at dawn');

        await expect(scheduled).toBeVisible();
        await expect(scheduled.getByText('Scheduled')).toBeVisible();
    });

    test('publishing with a schedule leaves the item scheduled until it is descheduled', {
        annotation: [
            {type: 'confluence', description: '1308524953 partial'}, // Schedule publishing (Nareg)
        ],
    }, async ({page}) => {
        const {monitoring, authoring} = await openForEditing(page, 'test sports story');
        const panel = await authoring.openActionsPanel('Publish');
        const enteredDate = await fillDateTime(panel.getByTestId('publish-schedule'), inTwoDaysAtTen());
        const prompt = saveChangesPrompt(page);
        const writes: Array<'save' | 'publish'> = [];

        page.on('request', (r) => {
            if (r.method() === 'PATCH' && r.url().includes('/api/archive/')) {
                writes.push(r.url().includes('/api/archive/publish/') ? 'publish' : 'save');
            }
        });

        await panel.getByTestId('publish').click();
        await expect(prompt).toContainText('There are some unsaved changes');
        await prompt.getByRole('button', {name: 'Cancel', exact: true}).click();

        await expect(prompt).toBeHidden();
        await expect(authoring.root).toBeVisible();
        await expect(panel.getByTestId('publish-schedule').getByTestId('date-input')).toHaveValue(enteredDate);

        await panel.getByTestId('publish').click();
        await prompt.getByRole('button', {name: 'Save', exact: true}).click();

        await expect(authoring.root).toBeHidden();

        const scheduled = monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'test sports story');

        await expect(scheduled).toBeVisible();
        await expect(scheduled.getByText('Scheduled')).toBeVisible();
        await expect(scheduled.getByTitle(/^Article is scheduled for /)).toContainText(enteredDate);

        // a publish that went ahead on Cancel would come before the save the second attempt makes
        expect(writes).toEqual(['save', 'publish']);

        await scheduled.dblclick();
        await authoring.root.getByTestId('deschedule').click();

        await expect(monitoring.getGroupedArticleLocator(WORKING_STAGE, 'test sports story')).toBeVisible();
        await expect(page.getByTestId('monitoring-group').and(page.locator(`[data-test-value="${SPORTS_OUTPUT}"]`)))
            .toBeVisible();
        await expect(scheduled).toHaveCount(0);
    });
});

// `required-headline` makes Story 3, the package's only item, fail validation: its headline is empty.
test('a package is published with its items once they pass validation', {
    annotation: [
        {type: 'confluence', description: '1308524959 complete'}, // Publish package (Nareg)
        {type: 'confluence', description: '1344443870 partial'}, // Check Publishing a package (Nareg)
    ],
}, async ({page}) => {
    const {monitoring, authoring} = await openForEditing(page, 'Package Highlight 1', 'required-headline');
    const packageAuthoring = new PackageAuthoring(page);

    await expect(packageAuthoring.groupItems('main')).toHaveCount(1);
    await expect(packageAuthoring.item('Story 3')).toBeVisible();

    const panel = await authoring.openActionsPanel('Publish');

    await panel.getByTestId('publish').click();
    await waitForToastMessage(page, 'error', 'Associated item Story 3 : HEADLINE empty values not allowed');

    await expect(authoring.root).toBeVisible();
    await expect(monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'Package Highlight 1')).toHaveCount(0);

    await panel.getByTestId('close').click();
    await authoring.close();

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator(WORKING_STAGE, 'Story 3'),
        'Edit',
    );
    await authoring.waitUntilOpen();
    await setEditor3FieldValue(authoring.input('headline'), 'Rohan musters');
    await authoring.saveAndGetRequest();
    await authoring.close();

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator(WORKING_STAGE, 'Package Highlight 1'),
        'Edit',
    );
    await authoring.waitUntilOpen();
    await (await authoring.openActionsPanel('Publish')).getByTestId('publish').click();

    await expect(authoring.root).toBeHidden();
    await expect(monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'Package Highlight 1')).toBeVisible();
    await expect(monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'Rohan musters')).toBeVisible();
    await expect(monitoring.getGroupedArticleLocator(WORKING_STAGE, 'Package Highlight 1')).toHaveCount(0);
});

test.describe('publishing depending on desk type', () => {
    // `canPublish` (scripts/api/article.ts) only withholds the Publish tab on an authoring desk under this flag
    test.use({
        storageState: getStorageState({features: {noPublishOnAuthoringDesk: true}}, {authoringReact: true}),
    });

    test('the publish tab is offered on a production desk and withheld on an authoring one', {
        annotation: [
            {type: 'confluence', description: '1310851134 complete'}, // Publishing depending on desk type
        ],
    }, async ({page}) => {
        const {monitoring, authoring} = await openForEditing(page, 'test sports story');
        let panel = await authoring.openActionsPanel();

        await expect(panel.getByTestId('tabs').getByRole('tab', {name: 'Send to'})).toBeVisible();
        await expect(panel.getByTestId('tabs').getByRole('tab', {name: 'Publish'})).toBeVisible();

        await panel.getByTestId('tabs').getByRole('tab', {name: 'Publish'}).click();
        await panel.getByTestId('publish').click();
        await expect(monitoring.getGroupedArticleLocator(SPORTS_OUTPUT, 'test sports story')).toBeVisible();

        const desks = new DeskSettings(page);

        await desks.open();
        await desks.openEdit('Sports');
        await desks.modal.getByTestId('field--desk-type').selectOption('authoring');
        await desks.saveAndClose();

        // the desks store loads once per application load
        await page.goto('/#/workspace/monitoring');
        await page.reload();
        await monitoring.selectDeskOrWorkspace('Sports');

        const story2 = monitoring.getGroupedArticleLocator(WORKING_STAGE, 'story 2');

        await monitoring.executeActionOnMonitoringItem(story2, 'Edit');
        await authoring.waitUntilOpen();
        await expect(story2.getByTestId('article-item-locked')).toHaveCount(1);

        panel = await authoring.openActionsPanel();

        await expect(panel.getByTestId('tabs').getByRole('tab', {name: 'Send to'})).toBeVisible();
        await expect(panel.getByTestId('tabs').getByRole('tab')).toHaveCount(1);
    });
});
