import {test, expect, Locator, Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

async function openTestSportsStory(page: Page): Promise<Authoring> {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'))
            .getByTestId('article-item')
            .filter({hasText: 'test sports story'}),
        'Edit',
    );
    await authoring.waitForAuthoringReactToInitialize();

    return authoring;
}

async function saveAndGetExtra(page: Page): Promise<{[fieldId: string]: unknown}> {
    const patch = page.waitForResponse(
        (response) => response.request().method() === 'PATCH' && response.url().includes('/api/archive/'),
    );

    await page.getByRole('button', {name: 'Save', exact: true}).click();

    const response = await patch;

    expect(response.ok()).toBe(true);

    return (await response.json()).extra;
}

async function box(locator: Locator) {
    await expect(locator).toBeVisible();

    return (await locator.boundingBox())!;
}

test.describe('custom fields (authoring-react)', () => {
    test('edits, removes and adds links in a urls field', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'custom-fields'});

        const authoring = await openTestSportsStory(page);
        const items = authoring.fieldContainer('sample_urls').getByTestId('url-item');

        await expect(items).toHaveCount(2);
        await expect(items.nth(0).getByTestId('url')).toHaveValue('http://example.com');
        await expect(items.nth(1).getByTestId('url')).toHaveValue('http://example.org');

        await items.nth(0).getByTestId('url-description').fill('Example com, edited');
        await items.nth(1).getByRole('button', {name: 'Remove'}).click();
        await expect(items).toHaveCount(1);

        await authoring.fieldContainer('sample_urls').getByRole('button', {name: 'Add url'}).click();
        await expect(items).toHaveCount(2);
        await items.nth(1).getByTestId('url').fill('http://example.net');
        await items.nth(1).getByTestId('url-description').fill('Example net');

        const extra = await saveAndGetExtra(page);

        expect(extra.sample_urls).toEqual([
            {url: 'http://example.com', description: 'Example com, edited'},
            {url: 'http://example.net', description: 'Example net'},
        ]);
    });

    test('saves the code and description of an embed field', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'custom-fields'});

        const authoring = await openTestSportsStory(page);
        const embed = authoring.fieldContainer('sample_embed');

        await embed.getByTestId('embed-code').fill('<iframe src="https://example.com/video"></iframe>');
        await embed.getByTestId('embed-description').fill('Example video');

        const extra = await saveAndGetExtra(page);

        expect(extra.sample_embed).toEqual({
            embed: '<iframe src="https://example.com/video"></iframe>',
            description: 'Example video',
        });
    });

    test('puts the field toggle on its own row, between the label and the input', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'custom-fields'});

        const authoring = await openTestSportsStory(page);

        const slugline = authoring.fieldContainer('slugline');
        const sluglineToggle = await box(slugline.getByTestId('field-toggle'));
        const sluglineInput = await box(slugline.getByTestId('authoring-field-input'));

        expect(sluglineToggle.y + sluglineToggle.height).toBeLessThanOrEqual(sluglineInput.y);
        expect(sluglineToggle.x).toBeCloseTo(sluglineInput.x, 0);

        // abstract is empty in the snapshot, so it starts toggled off and has no input yet
        const abstract = authoring.fieldContainer('abstract');

        await abstract.getByTestId('field-toggle').getByRole('checkbox').click();

        // measured after the click, which scrolls the field into view
        const abstractInput = await box(abstract.getByRole('textbox'));
        const abstractLabel = await box(abstract.getByTestId('authoring-field-label'));
        const abstractToggle = await box(abstract.getByTestId('field-toggle'));

        expect(abstractToggle.y).toBeGreaterThanOrEqual(abstractLabel.y + abstractLabel.height);
        expect(abstractInput.y).toBeGreaterThanOrEqual(abstractToggle.y + abstractToggle.height);
    });
});
