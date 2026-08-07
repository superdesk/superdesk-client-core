import {test, expect, Locator, Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({storageState: getStorageState({}, {authoringReact: true})});

function articleInWorkingStage(page: Page, title: string): Locator {
    return page.getByTestId('monitoring-group')
        .and(page.locator('[data-test-value="Sports / Working Stage"]'))
        .getByTestId('article-item')
        .filter({hasText: title});
}

/**
 * The panel is routed to whichever instance owns the article being edited, so an action
 * taken before authoring has taken the article would open the monitoring instance instead,
 * which renders different markup. The lock reaching the list item is the signal that
 * authoring has it.
 */
async function openForEditing(page: Page, title: string): Promise<Locator> {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);
    const article = articleInWorkingStage(page, title);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.executeActionOnMonitoringItem(article, 'Edit');
    await authoring.waitForAuthoringReactToInitialize();
    await expect(article.locator('.locked')).toBeVisible();

    return article;
}

/**
 * Scoped to the authoring host: the monitoring instance of this panel is a separate mount
 * that renders the legacy markup. The host is not inside `[data-test-id=authoring]`,
 * because the panel is deliberately rendered outside the editor it belongs to.
 */
function panelInAuthoring(page: Page): Locator {
    return page.getByTestId('authoring-actions-panel-overlay').getByTestId('interactive-actions-panel');
}

function authoringFrame(page: Page): Locator {
    return page.getByTestId('authoring').locator('.sd-editor-grid');
}

async function openPublishTab(page: Page): Promise<Locator> {
    await restoreDatabaseSnapshot();
    await openForEditing(page, 'test sports story');

    await page.getByTestId('authoring').getByTestId('open-send-publish-pane').click();

    const panel = panelInAuthoring(page);

    await expect(panel.getByTestId('panel-footer').getByTestId('publish')).toBeVisible();

    return panel;
}

function publishingColumns(panel: Locator): Locator {
    return panel.getByTestId('publishing-section').locator('> div');
}

/**
 * The panel container animates its width, so a measurement taken right after it opens or
 * after a tab change can land mid-transition.
 */
async function getSettledWidth(locator: Locator): Promise<number> {
    let previous = NaN;

    await expect.poll(async () => {
        const box = await locator.boundingBox();

        if (box == null) {
            return false;
        }

        const settled = box.width === previous;

        previous = box.width;

        return settled;
    }).toBe(true);

    return previous;
}

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

        await restoreDatabaseSnapshot();

        const article = await openForEditing(page, 'story 2');

        await monitoring.executeActionOnMonitoringItem(article, 'Send to');

        const panel = panelInAuthoring(page);

        await expect(panel).toBeVisible();
        await expect.poll(() => getBackgroundLuminance(panel)).toBeLessThan(0.5);

        await expect(panel.getByTestId('tabs').getByRole('tab', {name: 'Send to'})).toBeVisible();
        await expect(panel.getByTestId('destination-select')).toBeVisible();
        await expect(panel.getByTestId('panel-footer').getByTestId('send')).toBeVisible();

        await panel.getByTestId('close').click();

        await expect(panel).not.toBeVisible();
    });

    /**
     * Closing is done from the panel, not by clicking the toolbar control again. The panel is
     * anchored to the viewport and covers that control while it is open, which is how the angular
     * panel behaves too, so its own close button is the way out of both.
     */
    test('opens from the authoring toolbar and closes from the panel', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openForEditing(page, 'test sports story');

        const panel = panelInAuthoring(page);
        const toolbarButton = page.getByTestId('authoring').getByTestId('open-send-publish-pane');

        await expect(panel).toHaveCount(0);

        await toolbarButton.click();

        await expect(panel).toBeVisible();
        await expect(panel.getByTestId('tabs').getByRole('tab', {name: 'Publish'})).toBeVisible();
        await expect(panel.getByTestId('panel-footer').getByTestId('publish')).toBeVisible();
        await expect.poll(() => getBackgroundLuminance(panel)).toBeLessThan(0.5);

        await panel.getByTestId('close').click();

        await expect(panel).toHaveCount(0);
    });

    test('offers no send to / publish entry in the side widget rail', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openForEditing(page, 'test sports story');

        /**
         * The rail is where SDESK-7447 hosted these actions. Each entry is a `widget-icon`
         * carrying the widget id in `data-test-value`; the id is never a test id of its own,
         * so matching on it directly would pass whether or not the widget is registered.
         */
        await expect(
            page.getByTestId('widget-icon')
                .and(page.locator('[data-test-value="interactive-article-actions-widget"]')),
        ).toHaveCount(0);

        // the rail still renders, so the assertion above is about this widget and not an empty page
        await expect(page.getByTestId('widget-icon').first()).toBeVisible();

        await expect(page.getByTestId('authoring').getByTestId('open-send-publish-pane')).toHaveCount(1);
    });
});

/**
 * The active side widget is restored from state the app persisted in an earlier session, and
 * that state outlives the widget: anyone who selected the send to / publish widget before it
 * was removed still carries its id. Authoring has to survive the upgrade.
 */
test.describe('authoring-react opened with the removed widget still selected', () => {
    test.use({
        storageState: getStorageState({}, {
            authoringReact: true,
            localStorageEntries: [
                {name: 'SIDE_WIDGET', value: JSON.stringify('interactive-article-actions-widget')},
            ],
        }),
    });

    test('opens the editor instead of failing on the missing widget', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openForEditing(page, 'test sports story');

        await expect(page.getByTestId('authoring')).toBeVisible();
        await expect(page.getByTestId('authoring').getByTestId('open-send-publish-pane')).toBeVisible();
    });
});

/**
 * The publishing body is adaptive: it grows a column for every section contributed through
 * the `publishingSections` extension point, and the panel widens to match. No extension in
 * this repository contributes one, so these tests enable a test extension that does.
 * Without it `columnCount` is always 1 and the adaptive width cannot be observed at all.
 */
test.describe('interactive article actions panel with a contributed publishing section', () => {
    test.use({
        storageState: getStorageState({}, {authoringReact: true, publishingSections: true}),

        // two columns need more than the default 1280px, as they would in a real deployment
        viewport: {width: 1920, height: 1080},
    });

    test('renders the contributed section beside the standard publishing options', async ({page}) => {
        const panel = await openPublishTab(page);

        await expect(publishingColumns(panel)).toHaveCount(2);

        // proves the contribution point hands the section the article being published
        await expect(panel.getByTestId('extra-publishing-section--slugline')).toHaveText('test sports story');
    });

    test('widens the publish tab for the extra column while send to stays single width', async ({page}) => {
        const panel = await openPublishTab(page);

        await expect(publishingColumns(panel)).toHaveCount(2);

        const publishTabWidth = await getSettledWidth(panel);

        await panel.getByTestId('tabs').getByRole('tab', {name: 'Send to'}).click();
        await expect(panel.getByTestId('panel-footer').getByTestId('send')).toBeVisible();

        // send to contributes no sections, so it stays at a single column
        const sendToTabWidth = await getSettledWidth(panelInAuthoring(page));

        /**
         * One contributed section means two columns against send to's one. Comparing the two
         * tabs rather than a pixel width keeps this tied to the behaviour: it survives a
         * change to the single-column width, and still fails when the panel ignores
         * `columnCount`, which leaves both tabs exactly the same width.
         */
        expect(publishTabWidth / sendToTabWidth).toBeGreaterThan(1.6);
    });

    test('does not scroll the publish tab horizontally', async ({page}) => {
        const panel = await openPublishTab(page);

        await expect(publishingColumns(panel)).toHaveCount(2);

        const overflow = await panel.locator('.side-panel__content').evaluate(
            (element) => element.scrollWidth - element.clientWidth,
        );

        // the reported symptom: two columns squeezed into a single column width overflow it
        expect(overflow).toBeLessThanOrEqual(1);
    });
});

/**
 * At the default viewport the two column publish tab is wider than the authoring column,
 * which is the case the panel used to be rendered wrongly for: hosted in one of the frame's
 * side widget slots it was cut off along its inline-start edge, taking the labels and inputs
 * of the first column with it. Authoring-angular has never done this, because it renders the
 * same panel outside the editor.
 *
 * These tests are deliberately not run at a viewport wide enough for the panel to fit inside
 * the authoring column, since that is what hid the defect from the rest of this file.
 */
test.describe('interactive article actions panel wider than the authoring column', () => {
    test.use({storageState: getStorageState({}, {authoringReact: true, publishingSections: true})});

    /**
     * Clipping by an ancestor does not shrink `getBoundingClientRect`, so no measurement of
     * the panel itself can see it. Hit testing can: wherever something between the panel and
     * the viewport cuts it off, the point inside the panel is painted by whatever does the
     * cutting instead. The probes run down the inline-start edge, which is the edge the user
     * lost, and the one every clip in this layout eats into first.
     */
    function getUnpaintedInlineStartProbes(panel: Locator): Promise<Array<number>> {
        return panel.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const x = rect.left + 2;

            return [0.1, 0.5, 0.9]
                .map((fraction) => rect.top + (rect.height * fraction))
                .filter((y) => {
                    const painted = document.elementFromPoint(x, y);

                    return painted == null || element.contains(painted) !== true;
                });
        });
    }

    /** `boundingBox()` is nullable for a detached or hidden element; that is a test failure here. */
    async function requireBox(locator: Locator, what: string) {
        const box = await locator.boundingBox();

        if (box == null) {
            throw new Error(`expected ${what} to be visible and have a bounding box`);
        }

        return box;
    }

    async function expectPanelToBeUnclipped(panel: Locator): Promise<void> {
        await getSettledWidth(panel);

        const panelBox = await requireBox(panel, 'the actions panel');

        // it overlays what is beside the editor rather than being pushed off the screen
        expect(panelBox.x).toBeGreaterThanOrEqual(0);

        expect(await getUnpaintedInlineStartProbes(panel)).toEqual([]);
    }

    test('renders unclipped with no side widget pinned', async ({page}) => {
        const panel = await openPublishTab(page);

        await expect(publishingColumns(panel)).toHaveCount(2);

        await getSettledWidth(panel);

        const panelBox = await requireBox(panel, 'the actions panel');
        const frameBox = await requireBox(authoringFrame(page), 'the authoring frame');

        // the premise of the test: a panel that fits inside the editor would prove nothing
        expect(panelBox.width).toBeGreaterThan(frameBox.width);

        // like the angular panel, it reaches past the editor over what is beside it
        expect(panelBox.x).toBeLessThan(frameBox.x);

        await expectPanelToBeUnclipped(panel);
    });

    /**
     * Pinning resizes the monitoring list, so the editor is not reliably narrower than the
     * panel here and this test makes no claim about their relative widths. What it does
     * claim is that the panel comes up whole, which is what the pinned track used to deny.
     */
    test('renders unclipped with a side widget pinned', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openForEditing(page, 'test sports story');

        const authoring = page.getByTestId('authoring');

        // any pinnable widget will do; metadata is registered unconditionally
        await authoring.getByTestId('widget-icon')
            .and(page.locator('[data-test-value="metadata-widget"]'))
            .click();
        await authoring.getByRole('button', {name: 'Pin'}).click();

        /**
         * Pinning moves the side widget into a different grid column from the unpinned one,
         * and that column sets `overflow-x: hidden`. A panel routed into it is clipped
         * whatever the viewport, which is how this reached the user.
         */
        await expect(
            authoring.locator('.sd-editor-grid__sidetabs-content-pinned.sidetab-content-pinned--open'),
        ).toBeVisible();

        await authoring.getByTestId('open-send-publish-pane').click();

        const panel = panelInAuthoring(page);

        await expect(panel.getByTestId('panel-footer').getByTestId('publish')).toBeVisible();
        await expect(publishingColumns(panel)).toHaveCount(2);

        // the pinned widget keeps its place; the panel is no longer competing for the slot
        await expect(
            authoring.locator('.sd-editor-grid__sidetabs-content-pinned.sidetab-content-pinned--open'),
        ).toBeVisible();

        await expectPanelToBeUnclipped(panel);
    });
});
