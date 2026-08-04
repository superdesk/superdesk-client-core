import {test, expect, Locator} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({storageState: getStorageState({}, {authoringReact: true})});

/**
 * Relative luminance of the colour the browser actually paints, 0 (black) to 1 (white).
 * The panel container only carries the theme; the surface below it is what gets painted.
 */
function getBackgroundLuminance(panel: Locator): Promise<number> {
    return panel.evaluate((container) => {
        const surface = container.firstElementChild as HTMLElement;
        const channels = window.getComputedStyle(surface).backgroundColor.match(/[\d.]+/g) ?? [];
        const [r, g, b] = channels.slice(0, 3).map(Number);

        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    });
}

test.describe('interactive article actions panel in authoring-react', () => {
    test('opens over authoring on a dark surface and closes again', async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const article = page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'))
            .getByTestId('article-item')
            .filter({hasText: 'story 2'});

        await monitoring.executeActionOnMonitoringItem(article, 'Edit');
        await authoring.waitForAuthoringReactToInitialize();

        /**
         * The panel is routed to whichever instance owns the article being edited, so opening
         * "Send to" before authoring has taken the article would open the monitoring instance
         * instead, which renders different markup. The lock reaching the list item is the
         * signal that authoring has it.
         */
        await expect(article.locator('.locked')).toBeVisible();

        await monitoring.executeActionOnMonitoringItem(article, 'Send to');

        // scoped to authoring: the monitoring instance of this panel renders the legacy markup
        const panel = page.getByTestId('authoring').getByTestId('interactive-actions-panel');

        await expect(panel).toBeVisible();
        await expect.poll(() => getBackgroundLuminance(panel)).toBeLessThan(0.5);

        await expect(panel.getByTestId('tabs').getByRole('tab', {name: 'Send to'})).toBeVisible();
        await expect(panel.getByTestId('destination-select')).toBeVisible();
        await expect(panel.getByTestId('panel-footer').getByTestId('send')).toBeVisible();

        await panel.getByTestId('close').click();

        await expect(panel).not.toBeVisible();
    });
});
