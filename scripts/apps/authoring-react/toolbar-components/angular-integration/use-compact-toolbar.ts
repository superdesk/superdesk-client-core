import React from 'react';

// The `sd-media-query min-width="880"` angular puts on its top bar, below which it swaps button
// labels for icons. The directive (core/ui/ui.ts) measures the bar, not the viewport.
const COMPACT_TOOLBAR_WIDTH = 880;

const TOOLBAR_SELECTOR = '.sd-editor-grid__editor-subnav';

/**
 * Whether the authoring top bar the element sits in is too narrow for button labels. Measures the
 * bar rather than the viewport, so the monitoring pane beside it counts; opening a side panel does
 * not, since the bar spans the panel columns.
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
