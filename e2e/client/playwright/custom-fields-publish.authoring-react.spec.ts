import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {editArticle} from './scenarios/authoring-react-article';

test.use({storageState: getStorageState({}, {authoringReact: true})});

const EMBED = '<iframe src="https://example.com/video"></iframe>';

test('an article publishes with the values of its custom fields', {
    annotation: [
        // Publish article that uses new custom fields in CP
        {type: 'confluence', description: '1344443851 complete'},
    ],
}, async ({page}) => {
    // the Story profile of this snapshot carries urls, embed, boolean and dropdown custom fields
    await restoreDatabaseSnapshot({snapshotName: 'custom-fields'});

    const {monitoring, authoring} = await editArticle(page, 'test sports story');

    await authoring.fieldContainer('sample_embed').getByTestId('embed-code').fill(EMBED);
    await authoring.fieldContainer('sample_embed').getByTestId('embed-description').fill('Example video');
    await authoring.saveAndGetItem();

    const published = page.waitForResponse(
        (response) => response.url().includes('/api/archive/publish/') && response.request().method() === 'PATCH',
    );

    await authoring.publish({subscribers: []});

    const response = await published;

    expect(response.ok()).toBe(true);

    const item = await response.json();

    expect(item.state).toBe('published');
    expect(item.extra.sample_embed).toEqual({embed: EMBED, description: 'Example video'});
    expect(item.extra.sample_urls).toEqual([
        expect.objectContaining({url: 'http://example.com'}),
        expect.objectContaining({url: 'http://example.org'}),
    ]);

    await expect(authoring.root).toHaveCount(0);
    await expect(monitoring.getGroupedArticleLocator('Sports desk output', 'test sports story')).toBeVisible();
});
