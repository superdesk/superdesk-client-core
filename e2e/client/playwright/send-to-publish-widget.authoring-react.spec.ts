import {test, expect, Locator, Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {getStorageState} from './utils/storage-state';
import {TreeSelectDriver} from './utils/tree-select-driver';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

const SEND_TO_PUBLISH_WIDGET_ID = 'interactive-article-actions-widget';

function sendToPublishWidget(page: Page): Locator {
    return page.getByTestId('interactive-actions-widget');
}

function sportsWorkingStageItem(page: Page): Locator {
    return page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'));
}

async function openTestSportsStory(page: Page): Promise<void> {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.executeActionOnMonitoringItem(sportsWorkingStageItem(page), 'Edit');
    await authoring.waitForAuthoringReactToInitialize();
}

/**
 * WCAG relative luminance. Asserting on it rather than on a class name or a token
 * keeps the test tied to what the user sees, so it still fails if the theme is
 * applied through a different mechanism that ends up light.
 */
function relativeLuminance(cssColor: string): number {
    const components = cssColor.match(/[\d.]+/g);

    if (components == null || components.length < 3) {
        throw new Error(`unexpected colour format: ${cssColor}`);
    }

    const [red, green, blue] = components.slice(0, 3).map(Number);

    const channel = (value: number) => {
        const normalized = value / 255;

        return normalized <= 0.03928
            ? normalized / 12.92
            : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };

    return (0.2126 * channel(red)) + (0.7152 * channel(green)) + (0.0722 * channel(blue));
}

test('send to / publish widget renders on a dark surface', async ({page}) => {
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await openTestSportsStory(page);
    await authoring.openSideWidget(SEND_TO_PUBLISH_WIDGET_ID);

    const widget = sendToPublishWidget(page);

    await expect(widget).toBeVisible();

    // The theme attribute sits on the panel container, but the surface the user sees is
    // painted by the `.side-panel` inside it, so that is the element worth measuring.
    const background = await widget.locator('.side-panel').first()
        .evaluate((element) => window.getComputedStyle(element).backgroundColor);

    expect(relativeLuminance(background)).toBeLessThan(0.2);

    // the surface is dark because the theme tokens inherit from here
    await expect(widget).toHaveAttribute('data-theme', 'dark-ui');
});

test('article can be sent to another desk from the send to / publish widget', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await openTestSportsStory(page);
    await authoring.openSideWidget(SEND_TO_PUBLISH_WIDGET_ID);

    const widget = sendToPublishWidget(page);

    await expect(widget).toBeVisible();
    await widget.getByTestId('tabs').getByRole('tab', {name: 'Send to'}).click();

    // the tree select renders its popup in a portal outside the widget
    await new TreeSelectDriver(page, page.locator(s('destination-select'))).setValues('Finance');

    // Radio inputs are visually hidden behind sd-check-button labels.
    await widget.getByTestId('stage-select').getByRole('radio', {name: 'Working Stage'}).check({force: true});
    await widget.getByTestId('send').click();

    await monitoring.selectDeskOrWorkspace('Finance');

    await expect(
        page.locator(s('monitoring-group=Finance / Working Stage', 'article-item=test sports story')),
    ).toBeVisible();
});

test('Send to from the monitoring list opens the widget for the article being edited', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await openTestSportsStory(page);

    await expect(sendToPublishWidget(page)).toHaveCount(0);

    await monitoring.executeActionOnMonitoringItem(sportsWorkingStageItem(page), 'Send to');

    const widget = sendToPublishWidget(page);

    await expect(widget).toBeVisible();
    await expect(widget.getByTestId('tabs').getByRole('tab', {name: 'Send to', selected: true})).toBeVisible();
});
