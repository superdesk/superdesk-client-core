import {test, expect, type Page} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {InteractiveActionsPanel} from './page-object-models/interactive-actions-panel';
import {Monitoring} from './page-object-models/monitoring';
import {OpenedArticles} from './page-object-models/opened-articles';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {createArticleFromTemplate, editArticle} from './scenarios/authoring-react-article';

test.use({storageState: getStorageState({}, {authoringReact: true})});

const PERSONAL_ITEMS = 'Personal Items';
const SPORTS_WORKING_STAGE = 'Sports / Working Stage';

async function sendFromEditor(authoring: AuthoringReact, page: Page, destination: string, stage?: string) {
    const panel = new InteractiveActionsPanel(page);

    await authoring.openActionsPanel('Send to');
    await panel.selectDestination(destination);

    if (stage != null) {
        await panel.root.getByTestId('stage-select').getByTestId('item')
            .and(page.locator(`[data-test-value="${stage}"]`))
            .click();
    }

    await panel.send();
    await expect(authoring.root).toHaveCount(0);
}

test.describe('personal space (authoring-react)', () => {
    test('an article created from a template in the personal space is saved without a desk and listed there', {
        annotation: [
            {type: 'confluence', description: '1311835196 complete'}, // Create new article in Personal space
            // Create new article from a template in Personal space
            {type: 'confluence', description: '1311835206 complete'},
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new AuthoringReact(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/personal');
        await expect(monitoring.getGroupedArticleLocator(PERSONAL_ITEMS, 'personal space article 1')).toBeVisible();
        await monitoring.createArticleFromTemplate('story');
        await authoring.waitUntilOpen();

        await authoring.input('slugline').fill('article 1');

        const saved = await authoring.saveAndGetItem();

        expect(saved.task?.desk).toBeUndefined();
        await expect(monitoring.getGroupedArticleLocator(PERSONAL_ITEMS, 'article 1')).toBeVisible();
    });

    test('an article edited in the personal space is listed under its new slugline', {
        annotation: [
            {type: 'confluence', description: '1311835208 complete'}, // Edit article in Personal space
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new AuthoringReact(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/personal');
        await monitoring.executeActionOnMonitoringItem(
            monitoring.getGroupedArticleLocator(PERSONAL_ITEMS, 'personal space article 1'),
            'Edit',
        );
        await authoring.waitUntilOpen();

        await authoring.replaceEditor3FieldText(authoring.input('slugline'), 'personal space article 1.1');
        await authoring.saveAndGetItem();

        await expect(monitoring.getGroupedArticleLocator(PERSONAL_ITEMS, 'personal space article 1.1')).toBeVisible();
        await expect(monitoring.getGroupedArticleLocator(PERSONAL_ITEMS, 'personal space article 1')).toHaveCount(0);
    });

    test('an article sent from the personal space to a desk stage leaves the personal space', {
        annotation: [
            {type: 'confluence', description: '1311835216 complete'}, // Send item from Personal space
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new AuthoringReact(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/personal');
        await monitoring.executeActionOnMonitoringItem(
            monitoring.getGroupedArticleLocator(PERSONAL_ITEMS, 'personal space article 1'),
            'Edit',
        );
        await authoring.waitUntilOpen();

        await sendFromEditor(authoring, page, 'Sports', 'Working Stage');

        await expect(monitoring.getGroupedArticleLocator(PERSONAL_ITEMS, 'personal space article 1')).toHaveCount(0);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await expect(
            monitoring.getGroupedArticleLocator(SPORTS_WORKING_STAGE, 'personal space article 1'),
        ).toBeVisible();
    });

    test.describe('with sending to the personal space enabled', () => {
        test.use({storageState: getStorageState({features: {sendToPersonal: true}}, {authoringReact: true})});

        test('sends the open article from a desk to the personal space', {
            annotation: [
                {type: 'confluence', description: '1344443788 complete'}, // Send item to Personal space
            ],
        }, async ({page}) => {
            await restoreDatabaseSnapshot();

            const {monitoring, authoring} = await editArticle(page, 'test sports story');

            await sendFromEditor(authoring, page, 'Personal space');

            await expect(monitoring.getGroupedArticleLocator(SPORTS_WORKING_STAGE, 'story 2')).toBeVisible();
            await expect(monitoring.getGroupedArticleLocator(SPORTS_WORKING_STAGE, 'test sports story')).toHaveCount(0);

            await page.goto('/#/workspace/personal');
            await expect(monitoring.getGroupedArticleLocator(PERSONAL_ITEMS, 'test sports story')).toBeVisible();
        });
    });
});

test('an article created, saved and closed in a custom workspace is listed there without a prompt', {
    annotation: [
        // Create, save and close new article in custom workspace
        {type: 'confluence', description: '1318323005 complete'},
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const {monitoring, authoring} = await createArticleFromTemplate(page, 'story', 'Workspace 1');

    await authoring.input('slugline').fill('new article 2');
    await authoring.saveAndGetItem();
    await authoring.closeExpectingNoPrompt();

    await expect(monitoring.getListedArticle('new article 2')).toBeVisible();
});

test('the open items icon lists every open article and reopens the selected one', {
    annotation: [
        {type: 'confluence', description: '1308524865 complete'}, // Open items icon
    ],
}, async ({page}) => {
    // `main` ships two articles open in the bar, "Finances Story" and a headline-less one
    const SELECTED = 'test sports story';
    const OTHER = 'Finances Story';

    const monitoring = new Monitoring(page);
    const authoring = new AuthoringReact(page);
    const openedArticles = new OpenedArticles(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await expect(openedArticles.getBarItem(OTHER)).toBeVisible();

    await monitoring.getArticleLocator(SELECTED).dblclick();
    await authoring.waitUntilOpen();
    await expect(authoring.input('slugline')).toHaveText(SELECTED);
    await expect(openedArticles.getBarItems()).toHaveCount(3);

    await openedArticles.getBarItem(OTHER).click();
    await expect(authoring.input('slugline')).toHaveText(OTHER);

    await openedArticles.openDashboard();
    await expect(openedArticles.getDashboardItems()).toHaveCount(3);
    await openedArticles.getDashboardItem(SELECTED).click();

    await expect(openedArticles.getDashboard()).not.toBeVisible();
    await expect(authoring.input('slugline')).toHaveText(SELECTED);

    await openedArticles.openDashboard();
    await openedArticles.closeDashboard();

    // the X only dismisses the view, nothing is closed
    await expect(authoring.input('slugline')).toHaveText(SELECTED);
    await expect(openedArticles.getBarItems()).toHaveCount(3);
});
