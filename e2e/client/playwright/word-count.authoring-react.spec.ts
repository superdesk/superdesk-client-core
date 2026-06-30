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
