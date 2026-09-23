import React from 'react';

/**
 * authoring-angular swaps top bar button labels for icons below this width. It is the
 * `sd-media-query min-width="880"` on the top bar in authoring/views/authoring-topbar.html, applied
 * by the directive in core/ui/ui.ts, which measures the bar itself rather than the viewport.
 */
const COMPACT_TOOLBAR_WIDTH = 880;

const TOOLBAR_SELECTOR = '.sd-editor-grid__editor-subnav';

/**
 * Whether the authoring top bar the element sits in is too narrow for button labels. Tracks the bar
 * rather than the viewport, as the angular directive does, so the window and the monitoring pane
 * beside it both count. Opening a side panel does not: the bar spans the panel columns
 * (`grid-column: 1 / 6`), so its own width is unchanged.
 */
export function useCompactToolbar(ref: React.RefObject<HTMLElement>): boolean {
    const [compact, setCompact] = React.useState(false);

    React.useEffect(() => {
        const toolbar = ref.current?.closest(TOOLBAR_SELECTOR);

        if (toolbar == null) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            setCompact(entry.contentRect.width < COMPACT_TOOLBAR_WIDTH);
        });

        observer.observe(toolbar);

        return () => observer.disconnect();
    }, [ref]);

    return compact;
}
