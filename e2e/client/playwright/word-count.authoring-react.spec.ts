import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {getStorageState} from './utils/storage-state';
import {setEditor3FieldValue} from './utils/editor3';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test('header word count reflects the body and updates live (authoring-react)', async ({page}) => {
    await restoreDatabaseSnapshot();
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
        'Edit',
    );

    await authoring.waitForAuthoringReactToInitialize();

    const wordCount = page.locator(s('authoring-header-word-count'));

    await expect(wordCount).toBeVisible();

    const body = page.locator(s('authoring', 'authoring-field=body_html')).getByRole('textbox');

    await setEditor3FieldValue(body, 'one two three four five');

    // The header count updates asynchronously after typing (editor3 onChange is debounced); the
    // retrying toHaveAttribute assertion absorbs that delay.
    await expect(wordCount).toHaveAttribute('data-test-value', '5');
});

test('header shows the source but no word count for a non-text item (authoring-react)', async ({page}) => {
    await restoreDatabaseSnapshot();
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    // "Package Highlight 1" is the only non-text item in the main snapshot (type: composite).
    await monitoring.executeActionOnMonitoringItem(
        page
            .getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'))
            .getByTestId('article-item')
            .and(page.locator('[data-test-value="Package Highlight 1"]')),
        'Edit',
    );

    // Legacy renders SOURCE with no item-type condition, so it must survive on a package.
    await expect(page.getByTestId('authoring-header-source')).toHaveAttribute('data-test-value', 'Superdesk');
    await expect(page.getByTestId('authoring-header-word-count')).toHaveCount(0);
});
