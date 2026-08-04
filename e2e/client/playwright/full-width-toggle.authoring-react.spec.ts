import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {setEditor3FieldValue} from './utils/editor3';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test.describe('full width toggle in authoring-react', () => {
    const BODY = 'unsaved body that must survive';

    test('keeps unsaved article content that was never autosaved', async ({page}) => {
        await restoreDatabaseSnapshot();

        // Failing every autosave leaves no server-side copy, so surviving text can
        // only mean the editor kept its in-memory state across the toggle. It also
        // covers the toolbar flushing autosave before it toggles, which must not
        // leave the button waiting on a request that never succeeds.
        await page.route('**/archive_autosave**', (route) => route.abort());

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.createArticleFromDefaultTemplate();

        await authoring.waitForAuthoringReactToInitialize();

        const body = page.getByTestId('authoring')
            .getByTestId('authoring-field')
            .and(page.locator('[data-test-value="body_html"]'))
            .getByRole('textbox');

        await expect(body).toBeVisible();
        await setEditor3FieldValue(body, BODY);

        const toggleFullWidth = page.getByTestId('toggle-full-width');
        const mainContainer = page.locator('#main-container');

        await toggleFullWidth.click();
        await expect(mainContainer).toHaveClass(/hideMonitoring/);
        await expect(body).toHaveText(BODY);

        await toggleFullWidth.click();
        await expect(mainContainer).not.toHaveClass(/hideMonitoring/);
        await expect(body).toHaveText(BODY);
    });
});
