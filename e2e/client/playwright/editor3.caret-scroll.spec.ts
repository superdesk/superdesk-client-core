import {Monitoring} from './page-object-models/monitoring';
import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

/**
 * Regression test for Editor3 caret auto-scroll.
 *
 * DraftJS reconstructs the selection programmatically after every render, which
 * suppresses the browser's native caret-into-view behavior. Editor3Component
 * compensates by calling `scrollIntoView({block: 'nearest'})` on the caret's
 * [data-block="true"] ancestor on each `input`/`keyup`. This test guards that
 * compensation: typing past the bottom of the scroll container must leave the
 * caret's block within the visible scrollport (honoring `scroll-padding`).
 */
test('caret stays inside the visible scrollport when typing past the viewport', async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    const body = page.locator(s('authoring', 'authoring-field=body_html')).getByRole('textbox');

    await body.click();
    await page.keyboard.press('End');

    const initialScrollTop = await page.evaluate(() => {
        const container = document.querySelector('.page-content-container--scrollable') as HTMLElement | null;

        return container?.scrollTop ?? 0;
    });

    // Viewport is 1280x800 (see playwright.config.ts). 40 empty paragraphs comfortably
    // exceed the visible scroll area, so without the auto-scroll fix the caret ends up
    // below the scrollport.
    for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Enter');
    }

    // Type a character at the end so we also exercise the `input`-driven path
    // (Enter goes through `keyup` in our listener; a printable key fires both).
    await page.keyboard.type('x');

    // scrollCaretIntoView runs on requestAnimationFrame, so wait until the
    // container reflects the expected scroll before measuring geometry.
    await expect.poll(async () => page.evaluate(() => {
        const container = document.querySelector('.page-content-container--scrollable') as HTMLElement | null;

        return container?.scrollTop ?? 0;
    })).toBeGreaterThan(initialScrollTop);

    const measurement = await page.evaluate(() => {
        const container = document.querySelector('.page-content-container--scrollable') as HTMLElement | null;

        if (container == null) {
            return {error: 'scroll container not found'};
        }

        const sel = window.getSelection();

        if (sel == null || sel.focusNode == null) {
            return {error: 'no selection'};
        }

        const caretNode = sel.focusNode.nodeType === Node.TEXT_NODE
            ? sel.focusNode.parentElement
            : sel.focusNode instanceof Element ? sel.focusNode : null;
        const caretBlock = caretNode?.closest('[data-block="true"]') ?? null;

        if (caretBlock == null) {
            return {error: 'caret block not found'};
        }

        const cs = getComputedStyle(container);
        const padTop = parseFloat(cs.scrollPaddingBlockStart || cs.scrollPaddingTop || '0') || 0;
        const padBottom = parseFloat(cs.scrollPaddingBlockEnd || cs.scrollPaddingBottom || '0') || 0;

        const containerRect = container.getBoundingClientRect();
        const blockRect = caretBlock.getBoundingClientRect();

        return {
            scrollTop: container.scrollTop,
            visibleTop: containerRect.top + padTop,
            visibleBottom: containerRect.bottom - padBottom,
            blockTop: blockRect.top,
            blockBottom: blockRect.bottom,
        };
    });

    if ('error' in measurement) {
        throw new Error(measurement.error);
    }

    // Scrolling actually happened — otherwise the test would pass trivially on a
    // viewport tall enough to fit 40 paragraphs.
    expect(measurement.scrollTop).toBeGreaterThan(initialScrollTop);

    // Core assertion: the caret's block has not been pushed below the visible
    // scrollport. A 2px tolerance absorbs sub-pixel rounding from getBoundingClientRect.
    expect(measurement.blockBottom).toBeLessThanOrEqual(measurement.visibleBottom + 2);

    // And it shouldn't have been pushed above either (catches "scrolled too far" regressions).
    expect(measurement.blockTop).toBeGreaterThanOrEqual(measurement.visibleTop - 2);
});
