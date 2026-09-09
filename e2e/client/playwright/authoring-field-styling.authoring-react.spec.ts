import {test, expect, Locator, Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

const PANEL_BG = 'rgb(243, 245, 246)'; // --sd-colour-panel-bg--100
const INTERACTIVE_ACTIVE = 'rgb(51, 122, 153)'; // --sd-colour-interactive--active
const SUBNAV_BG = 'rgb(232, 234, 237)'; // --sd-colour-panel-bg--200

async function openFromSports(
    page: Page,
    options: {group: string, item: string, action: string},
): Promise<void> {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.waitUntilReady();
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('monitoring-group')
            .and(page.locator(`[data-test-value="${options.group}"]`))
            .getByTestId('article-item')
            .filter({hasText: options.item}),
        options.action,
    );
    await authoring.waitForAuthoringReactToInitialize();
}

function openTestSportsStory(page: Page): Promise<void> {
    return openFromSports(page, {
        group: 'Sports / Working Stage',
        item: 'test sports story',
        action: 'Edit',
    });
}

function field(page: Page, fieldId: string): Locator {
    return page.getByTestId('authoring-field').and(page.locator(`[data-test-value="${fieldId}"]`));
}

function labelStyle(label: Locator, property: string): Promise<string> {
    return label.evaluate(
        (el, prop) => window.getComputedStyle(el).getPropertyValue(prop),
        property,
    );
}

test.describe('authoring-react field styling', () => {
    test('lays a header field label out in a column to the left of its input', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const slugline = field(page, 'slugline');
        const label = slugline.getByTestId('authoring-field-label');
        const input = slugline.getByTestId('authoring-field-input');

        await expect(label).toBeVisible();

        const labelBox = (await label.boundingBox())!;
        const inputBox = (await input.boundingBox())!;

        expect(labelBox.y).toBe(inputBox.y);
        expect(labelBox.x + labelBox.width).toBe(inputBox.x);

        // authoring-angular's `.authoring-header__item-label` column
        expect(labelBox.width).toBe(90);
        expect(await labelStyle(label, 'text-align')).toBe('end');
        expect(await labelStyle(label, 'text-transform')).toBe('uppercase');
    });

    test('keeps a body field label above its input', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const headline = field(page, 'headline');
        const label = headline.getByTestId('authoring-field-label');

        await expect(label).toBeVisible();

        const labelBox = (await label.boundingBox())!;
        const editorBox = (await headline.locator('[contenteditable]').first().boundingBox())!;

        expect(labelBox.y + labelBox.height).toBeLessThanOrEqual(editorBox.y);
    });

    test('shows the item type icon to the left of the profile selector', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const icon = page.getByTestId('item-type-icon');

        await expect(icon).toBeVisible();
        await expect(icon).toHaveAttribute('data-test-value', 'text');
        await expect(icon).toHaveClass('filetype-icon-text');

        const iconBox = (await icon.boundingBox())!;
        const profileBox = (await page.getByTestId('content-profile-select').boundingBox())!;

        expect(iconBox.x).toBeLessThan(profileBox.x);
    });

    test('greys a body field label, darkens it on hover and turns it blue on focus', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const headline = field(page, 'headline');
        const label = headline.getByTestId('authoring-field-label');

        await expect(label).toBeVisible();

        // the label transitions between states, so every reading has to be polled

        // the pointer starts over the monitoring list, outside the article body
        await expect.poll(() => labelStyle(label, 'opacity')).toBe('0.4');

        await headline.hover();
        await expect.poll(() => labelStyle(label, 'opacity')).toBe('1');
        await expect.poll(() => labelStyle(label, 'background-color')).toBe('rgba(0, 0, 0, 0.4)');

        await headline.locator('[contenteditable]').first().click();

        // the click leaves the pointer on the field, so move it off to prove the blue is focus
        await page.mouse.move(5, 5);

        await expect.poll(() => labelStyle(label, 'background-color')).toBe(INTERACTIVE_ACTIVE);
        await expect.poll(() => labelStyle(label, 'opacity')).toBe('1');

        // a field that is neither hovered nor focused stays grey
        const bylineLabel = field(page, 'byline').getByTestId('authoring-field-label');

        await expect.poll(() => labelStyle(bylineLabel, 'opacity')).toBe('0.4');
    });

    /**
     * Every side widget paints its body rather than its panel, which is what keeps the header
     * white. Read off the panel in one go: `PanelContentBlock` takes no test id.
     */
    for (const widgetId of ['related-item', 'comments', 'suggestions', 'versioning']) {
        test(`paints the ${widgetId} widget body and leaves its header white`, async ({page}) => {
            await restoreDatabaseSnapshot();
            await openTestSportsStory(page);

            await page.getByTestId('widget-icon').and(page.locator(`[data-test-value="${widgetId}"]`)).click();

            const panel = page.getByTestId('authoring-widget-panel').first();

            await expect(panel).toBeVisible();

            const styles = await panel.evaluate((el) => {
                const read = (selector: string) => {
                    const target = el.querySelector(selector);

                    if (target == null) {
                        return null;
                    }

                    const computed = window.getComputedStyle(target);

                    return {background: computed.backgroundColor, padding: computed.padding};
                };

                return {header: read('.side-panel__header'), body: read('.side-panel__content-block')};
            });

            expect(styles.header?.background).toBe('rgb(255, 255, 255)');
            expect(styles.body?.background).toBe(PANEL_BG);
            expect(styles.body?.padding).toBe('16px');
        });
    }
});

/**
 * The header collapse. authoring-angular runs a 150ms linear height slide from `slideUpDown`
 * (core/ui/slide-up-down.ts); the ui-framework transitions a `max-height` ceiling instead, which is
 * why this asserts the property as well as the timing.
 */
test.describe('authoring-react header collapse', () => {
    function header(page: Page): Locator {
        return page.locator('.sd-editor-content__authoring-header');
    }

    function holder(page: Page): Locator {
        return page.locator('.sd-editor-content__authoring-header > .authoring-header__holder');
    }

    test('slides the header on the row track over the same 150ms linear as angular', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const transition = await header(page).evaluate((el) => {
            const computed = window.getComputedStyle(el);

            return {
                property: computed.transitionProperty,
                duration: computed.transitionDuration,
                timing: computed.transitionTimingFunction,
            };
        });

        expect(transition.property.split(', ')).toContain('grid-template-rows');
        expect(new Set(transition.duration.split(', '))).toEqual(new Set(['0.15s']));
        expect(new Set(transition.timing.split(', '))).toEqual(new Set(['linear']));

        // the declared transition proves the intent; this proves one actually runs on collapse
        const running = await header(page).evaluate((el) => {
            (el.querySelector('.authoring-header__toggle') as HTMLElement).click();

            return el.getAnimations().map((animation) => ({
                property: (animation as CSSTransition).transitionProperty,
                duration: animation.effect?.getTiming().duration ?? null,
            }));
        });

        expect(running).toContainEqual({property: 'grid-template-rows', duration: 150});
    });

    test('collapses the header to nothing and restores it', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const expandedHeight = (await header(page).boundingBox())!.height;

        expect(expandedHeight).toBeGreaterThan(100);

        await page.locator('.sd-editor-content__authoring-header .authoring-header__toggle').click();
        await expect.poll(async () => (await header(page).boundingBox())!.height).toBe(0);

        await page.locator('.sd-editor-content__authoring-header .authoring-header__toggle').click();
        await expect.poll(async () => (await header(page).boundingBox())!.height).toBe(expandedHeight);
    });

    test('clips the header while collapsed and releases it once expanded', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const overflow = () => holder(page).evaluate((el) => window.getComputedStyle(el).overflow);

        // header fields open their dropdowns inline, so anything but `visible` here clips them
        await expect.poll(overflow).toBe('visible');

        await page.locator('.sd-editor-content__authoring-header .authoring-header__toggle').click();
        await expect.poll(overflow).toBe('hidden');

        await page.locator('.sd-editor-content__authoring-header .authoring-header__toggle').click();
        await expect.poll(overflow).toBe('visible');
    });
});

test.describe('authoring-react item state badge', () => {
    test('shows the state badge to the left of the created and modified info', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const badge = page.getByTestId('authoring-item-state');

        await expect(badge).toBeVisible();
        await expect(badge).toHaveText('In Progress');

        const badgeBox = (await badge.boundingBox())!;
        const created = page.getByTestId('authoring-toolbar-1').filter({hasText: 'Created'}).getByText('Created');
        const createdBox = (await created.boundingBox())!;

        expect(badgeBox.x + badgeBox.width).toBeLessThanOrEqual(createdBox.x);
    });

    test('reads the badge from the item state, not a fixed label', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openFromSports(page, {group: 'Sports desk output', item: 'Story 5', action: 'Open'});

        await expect(page.getByTestId('authoring-item-state')).toHaveText('Published');
    });
});

/**
 * `sd-width` is a basis in authoring-angular (`[sd-width="quarter"] {flex-basis: 25%}` in
 * styles/sass/mixins.scss), on an item that grows, so a short row is filled by the fields on it.
 */
test.describe('authoring-react field row widths', () => {
    test('fills a header row that the configured widths leave short', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        // priority and urgency are configured `quarter`, so their bases cover only half the row
        const priority = (await field(page, 'priority').boundingBox())!;
        const urgency = (await field(page, 'urgency').boundingBox())!;
        const wholeRow = (await field(page, 'slugline').boundingBox())!;

        expect(priority.width).toBe(urgency.width);
        expect(priority.x).toBe(wholeRow.x);
        expect(Math.round(urgency.x + urgency.width)).toBe(Math.round(wholeRow.x + wholeRow.width));
    });

    test('leaves a full-width field and an already full row at their configured widths', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const slugline = (await field(page, 'slugline').boundingBox())!;
        const categories = (await field(page, 'anpa_category').boundingBox())!;
        const genre = (await field(page, 'genre').boundingBox())!;
        const place = (await field(page, 'place').boundingBox())!;

        expect(categories.width).toBe(slugline.width);
        expect(genre.width).toBe(place.width);
        expect(genre.width).toBeLessThan(slugline.width);
        expect(Math.round(place.x + place.width)).toBe(Math.round(slugline.x + slugline.width));
    });

    /**
     * The packages profile is built in code and sets no width on its fields, so it is the reachable
     * case for the missing fallback.
     */
    test('gives a field with no configured width the whole row', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openFromSports(page, {
            group: 'Sports / Working Stage',
            item: 'Package Highlight 1',
            action: 'Edit',
        });

        const headline = field(page, 'headline');

        await expect(headline).toBeVisible();

        const box = (await headline.boundingBox())!;
        const rowWidth = await headline.evaluate(
            (el) => (el.parentElement!.parentElement as HTMLElement).getBoundingClientRect().width,
        );

        expect(Math.round(box.width)).toBe(Math.round(rowWidth));
    });
});

test.describe('authoring-react top bar', () => {
    const topBar = '.sd-editor-grid__editor-subnav';

    test('paints the top bar without repainting the bar below it', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const bar = await page.locator(topBar).evaluate((el) => {
            const computed = window.getComputedStyle(el);
            // the framework's own subnav carries `--sd-shadow__subnav`, which is the seam
            // authoring-angular draws, so compare against it rather than a resolved colour triple
            const reference = window.getComputedStyle(document.querySelector('.subnav--light')!);

            return {
                background: computed.backgroundColor,
                borderBottomWidth: computed.borderBottomWidth,
                borderBottomStyle: computed.borderBottomStyle,
                boxShadow: computed.boxShadow,
                referenceShadow: reference.boxShadow,
                position: computed.position,
                zIndex: Number(computed.zIndex),
                referenceZIndex: Number(reference.zIndex),
            };
        });

        expect(bar.background).toBe(SUBNAV_BG);

        // neither implementation uses a border here; the seam is a shadow
        expect(bar.borderBottomWidth).toBe('0px');
        expect(bar.borderBottomStyle).toBe('none');
        expect(bar.boxShadow).not.toBe('none');
        expect(bar.boxShadow).toBe(bar.referenceShadow);

        // the bar below is opaque and positioned, so the shadow only shows while the top bar
        // outranks it
        expect(bar.position).not.toBe('static');
        expect(bar.zIndex).toBeGreaterThan(bar.referenceZIndex);

        // the created/modified bar keeps its own lighter background
        const secondary = await page.getByTestId('authoring-item-state').evaluate(
            (el) => window.getComputedStyle(el.closest('.subnav')!).backgroundColor,
        );

        expect(secondary).not.toBe(SUBNAV_BG);
    });

    /**
     * authoring-angular swaps the close label for an icon once the top bar drops below 880px, via
     * the `sd-media-query` directive on the bar itself. Both viewports here are far from that edge:
     * the bar measures 691px at 1280 and 968px at 2200.
     */
    test('swaps the close label for an icon when the top bar gets narrow', async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.setViewportSize({width: 1280, height: 800});
        await openTestSportsStory(page);

        // the opened-articles bar at the bottom carries `close` buttons too
        const close = page.getByTestId('authoring').getByTestId('close');
        const icon = close.locator('[class*="icon-close-small"]');

        await expect(close).toBeVisible();
        await expect(icon).toBeVisible();
        await expect(close).toHaveText('');

        // square and hollow like angular's, and level with the save button beside it
        const shape = await close.evaluate((el) => {
            const button = el.querySelector('button')!;
            const save = Array.from(el.closest('div')!.parentElement!.querySelectorAll('button'))
                .find((b) => (b.textContent ?? '').trim().toLowerCase() === 'save');
            const rect = button.getBoundingClientRect();
            const saveRect = save?.getBoundingClientRect();

            return {
                borderRadius: window.getComputedStyle(button).borderRadius,
                height: Math.round(rect.height),
                centerY: Math.round(rect.y + rect.height / 2),
                saveCenterY: saveRect == null ? null : Math.round(saveRect.y + saveRect.height / 2),
            };
        });

        expect(shape.borderRadius).toBe('3px');
        expect(shape.height).toBe(32);
        expect(shape.centerY).toBe(shape.saveCenterY);

        await page.setViewportSize({width: 2200, height: 800});

        await expect(close).toHaveText('Close');
        await expect(icon).toHaveCount(0);

        // it tracks the bar rather than rendering once, so it swaps back
        await page.setViewportSize({width: 1280, height: 800});

        await expect(icon).toBeVisible();
        await expect(close).toHaveText('');
    });
});

/**
 * The shadow down the article column's left edge is not declared on the column. It is the monitoring
 * pane's own right-hand shadow falling across it, which is how authoring-angular gets the same edge,
 * so what has to hold is the painting order between the two.
 */
test.describe('authoring-react column edge', () => {
    test('keeps the authoring root under the pane that casts the column shadow', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const order = await page.evaluate(() => {
            const root = document.querySelector('.sd-authoring-react')!;
            const columnLeft = root.getBoundingClientRect().left;
            const pane = Array.from(document.querySelectorAll('*')).find((el) => {
                const computed = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();

                return computed.boxShadow !== 'none'
                    && rect.height > 400
                    && Math.abs(rect.right - columnLeft) < 2;
            });

            return {
                rootZIndex: Number(window.getComputedStyle(root).zIndex),
                paneZIndex: pane == null ? null : Number(window.getComputedStyle(pane).zIndex),
                paneShadow: pane == null ? null : window.getComputedStyle(pane).boxShadow,
            };
        });

        // a blurred shadow off the pane's right edge is what reaches the column
        expect(order.paneShadow).toContain('10px');
        expect(order.paneZIndex).not.toBeNull();
        expect(order.rootZIndex).toBeLessThan(order.paneZIndex!);
    });
});
