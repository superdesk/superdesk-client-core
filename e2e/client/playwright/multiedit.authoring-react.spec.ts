import {test, expect, Locator, Page} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

/**
 * QA case "Multiedit" on authoring-react, which replaces the angular multi-edit board with a
 * modal holding one authoring-react editor per article (`multi-edit-modal.tsx`).
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});

test.setTimeout(60000);

const WORKING_STAGE = 'Sports / Working Stage';

// the panes are keyed by article id, which the list item carries as its DOM id
async function paneFor(page: Page, item: Locator): Promise<Locator> {
    const id = await item.evaluate((element) => element.id);

    return page.getByTestId('multiedit-article').and(page.locator(`[data-test-value="${id}"]`));
}

function headline(pane: Locator): Locator {
    return pane.getByTestId('authoring-field').and(pane.page().locator('[data-test-value="headline"]'))
        .getByRole('textbox');
}

async function saveHeadline(pane: Locator, value: string): Promise<void> {
    const save = pane.getByTestId('save');

    await setEditor3FieldValue(headline(pane), value);
    await expect(save).toBeEnabled();

    const [response] = await Promise.all([
        pane.page().waitForResponse((r) => r.request().method() === 'PATCH' && r.url().includes('/api/archive/')),
        save.click(),
    ]);

    expect(response.status()).toBe(200);
    await expect(save).toBeDisabled();
}

test('edits two articles side by side and saves each one', {
    annotation: [
        {type: 'confluence', description: '1311834330 complete'}, // Multiedit
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new AuthoringReact(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const first = monitoring.getGroupedArticleLocator(WORKING_STAGE, 'test sports story');
    const second = monitoring.getGroupedArticleLocator(WORKING_STAGE, 'story 2');
    const firstPane = await paneFor(page, first);
    const secondPane = await paneFor(page, second);

    await monitoring.executeBulkAction('Multi-edit', ['test sports story', 'story 2']);

    await expect(firstPane).toBeVisible();
    await expect(secondPane).toBeVisible();
    await authoring.waitForAuthoringReactToInitialize();

    await expect(headline(firstPane)).toHaveText('test sports story');

    await saveHeadline(firstPane, 'test sports story 1.1');
    await saveHeadline(secondPane, 'story 2.1');

    await page.getByTestId('multiedit-modal').getByRole('button', {name: 'Close', exact: true}).click();
    await expect(firstPane).toBeHidden();

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator(WORKING_STAGE, 'test sports story 1.1'),
        'Edit',
    );
    await authoring.waitUntilOpen();
    await expect(authoring.input('headline')).toHaveText('test sports story 1.1');
    await authoring.close();

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator(WORKING_STAGE, 'story 2.1'),
        'Edit',
    );
    await authoring.waitUntilOpen();
    await expect(authoring.input('headline')).toHaveText('story 2.1');
});
