import {test, expect, Page} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {editArticle} from './scenarios/authoring-react-article';
import {TreeSelectDriver} from './utils/tree-select-driver';

/**
 * QA cases "Send item to another desk", "Send item to another stage" and "Sending items between
 * desks" (publish from another desk), driven from the authoring-react editor's send / publish panel.
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});

async function editStory2(page: Page): Promise<{monitoring: Monitoring; authoring: AuthoringReact}> {
    await restoreDatabaseSnapshot();

    return editArticle(page, 'story 2');
}

test.describe('sending an article from authoring-react', () => {
    test('sends an article to another desk and closes the editor', {
        annotation: [
            {type: 'confluence', description: '1308524834 complete'}, // Send item to another desk
        ],
    }, async ({page}) => {
        const {monitoring, authoring} = await editStory2(page);

        await authoring.sendToFromEditor({desk: 'Education', stage: 'Working Stage'});

        await expect(authoring.root).toBeHidden();
        await expect(page.getByTestId('monitoring-group').first()).toBeVisible();
        await expect(monitoring.getGroupedArticleLocator('Sports / Working Stage', 'story 2')).toBeHidden();

        await monitoring.selectDeskOrWorkspace('Education');
        await expect(monitoring.getGroupedArticleLocator('Education / Working Stage', 'story 2')).toBeVisible();
    });

    test('sends an article to another stage of the same desk', {
        annotation: [
            {type: 'confluence', description: '1308524832 complete'}, // Send item to another stage
        ],
    }, async ({page}) => {
        const {monitoring, authoring} = await editStory2(page);

        await authoring.sendToFromEditor({desk: 'Sports', stage: 'Incoming Stage'});

        await expect(authoring.root).toBeHidden();
        await expect(monitoring.getGroupedArticleLocator('Sports / Incoming Stage', 'story 2')).toBeVisible();
        await expect(monitoring.getGroupedArticleLocator('Sports / Working Stage', 'story 2')).toBeHidden();
    });

    test('publishes an article from another desk, landing in that desk\'s output', {
        annotation: [
            {type: 'confluence', description: '1344443827 complete'}, // Sending items between desks_
        ],
    }, async ({page}) => {
        const {monitoring, authoring} = await editStory2(page);

        const panel = await authoring.openActionsPanel('Publish');

        await new TreeSelectDriver(page, panel.getByTestId('destination-select')).setValues('Education');
        await panel.getByTestId('publish-from').click();

        await expect(authoring.root).toBeHidden();

        await monitoring.selectDeskOrWorkspace('Education');
        await expect(monitoring.getGroupedArticleLocator('Education desk output', 'story 2')).toBeVisible();
    });
});
