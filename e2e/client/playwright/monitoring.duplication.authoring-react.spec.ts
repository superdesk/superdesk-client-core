import {test, expect, type Page} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {TreeSelectDriver} from './utils/tree-select-driver';

/**
 * Duplicating is a list action in both editors. These tests end by editing the copy, which is
 * the part that runs in authoring-react.
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});

const ARTICLE = 'test sports story';

function duplicateResponse(page: Page) {
    return page.waitForResponse(
        (response) => /\/api\/archive\/[^/]+\/duplicate/.test(response.url()) && response.request().method() === 'POST',
    );
}

async function editAndCheckCopy(page: Page, copyId: string): Promise<void> {
    const authoring = new AuthoringReact(page);

    // the client opens the item named in the URL only while booting
    await page.goto(`/#/workspace/monitoring?item=${encodeURIComponent(copyId)}&action=edit`);
    await page.reload();
    await authoring.waitUntilOpen();

    await expect(authoring.input('slugline')).toHaveText(ARTICLE);
    await expect(authoring.input('body_html')).toHaveText('test sport story body');

    await authoring.replaceEditor3FieldText(authoring.input('headline'), 'edited copy');

    const saved = await authoring.saveAndGetItem();

    expect(saved._id).toBe(copyId);
    expect(saved.headline).toBe('edited copy');
}

test('duplicating in place adds a copy to the same stage that opens for editing', {
    annotation: [
        {type: 'confluence', description: '1311835241 complete'}, // Duplicate article in place
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);
    const workingStage = monitoring.getGroupLocator('Sports / Working Stage');
    const items = workingStage.getByTestId('article-item').filter({hasText: ARTICLE});

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await expect(items).toHaveCount(1);

    const duplicated = duplicateResponse(page);

    await monitoring.executeActionOnMonitoringItem(items, 'Duplicate', 'Duplicate in place');

    const copy = await (await duplicated).json();

    await expect(items).toHaveCount(2);
    await editAndCheckCopy(page, copy._id);
});

test('duplicating to another desk and stage puts a copy there that opens for editing', {
    annotation: [
        {type: 'confluence', description: '1311835243 complete'}, // Duplicate article to another place
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator('Sports / Working Stage', ARTICLE),
        'Duplicate',
        'Duplicate To',
    );

    const panel = page.getByTestId('interactive-actions-panel');

    await new TreeSelectDriver(page, panel.getByTestId('destination-select')).setValues('Finance');
    await panel.getByTestId('stage-select').getByRole('radio', {name: 'Working Stage'}).check();

    const duplicated = duplicateResponse(page);

    await panel.getByTestId('duplicate').click();

    const copy = await (await duplicated).json();

    await monitoring.selectDeskOrWorkspace('Finance');
    await expect(monitoring.getGroupedArticleLocator('Finance / Working Stage', ARTICLE)).toBeVisible();
    await editAndCheckCopy(page, copy._id);
});
