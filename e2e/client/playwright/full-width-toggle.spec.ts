import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

test.describe('full width toggle in authoring', () => {
    const HEADLINE = 'unsaved headline that must survive';

    test('keeps unsaved article content that was never autosaved', async ({page}) => {
        await restoreDatabaseSnapshot();

        // Failing every autosave leaves no server-side copy, so surviving text can
        // only mean the editor kept its in-memory state across the toggle.
        await page.route('**/archive_autosave**', (route) => route.abort());

        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.createArticleFromDefaultTemplate();

        const headline = page.getByTestId('field--headline').getByRole('textbox');

        await expect(headline).toBeVisible();
        await headline.fill(HEADLINE);
        await expect(headline).toHaveText(HEADLINE);

        const toggleFullWidth = page.getByTestId('authoring-topbar').getByTestId('toggle-full-width');
        const mainContainer = page.locator('#main-container');

        await toggleFullWidth.click();
        await expect(mainContainer).toHaveClass(/hideMonitoring/);
        await expect(headline).toHaveText(HEADLINE);

        await toggleFullWidth.click();
        await expect(mainContainer).not.toHaveClass(/hideMonitoring/);
        await expect(headline).toHaveText(HEADLINE);
    });
});
