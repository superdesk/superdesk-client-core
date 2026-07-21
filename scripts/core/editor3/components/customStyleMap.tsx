import {customEditorControls} from 'core/editor3/CustomEditorControls';

export const CUSTOM_EDITOR_TAG_ATTR = 'custom-editor-tag-id';

export const customEditorTagStyleMap: Record<string, React.CSSProperties> = customEditorControls.getStyleMap();

export function applyCustomEditorTagStyles(element: HTMLElement, tagId: string): void {
    const style = customEditorTagStyleMap[tagId];

    if (style != null) {
        for (const [prop, value] of Object.entries(style)) {
            // Keep the span inline: under the preview's default white-space, an
            // inline-block box trims edge whitespace and would drop a trailing space
            // that is part of the styled range. The border renders fine inline.
            if (prop === 'display') {
                continue;
            }

            element.style[prop] = value as string;
        }
    }
}

export const customStyleMap = {
    ...customEditorTagStyleMap,

    HIGHLIGHT: {
        display: 'inline-block',
        padding: '1px 3px',
        backgroundColor: 'rgba(255, 235, 59, 0.2)',
    },

    HIGHLIGHT_STRONG: {
        display: 'inline-block',
        padding: '1px 3px',
        backgroundColor: 'rgba(255, 235, 59, 0.8)',
    },

    COMMENT: {
        backgroundColor: 'var(--sd-editor-colour__comment-bg)',
    },

    COMMENT_SELECTED: {
        backgroundColor: 'var(--sd-editor-colour__comment-bg)',
    },

    ANNOTATION: {
        borderBlockEnd: '4px solid var(--sd-editor-colour__annotation)',
    },

    ANNOTATION_SELECTED: {
        borderBlockEnd: '4px solid rgba(100, 205, 0, 1.0)',
    },

    STRIKETHROUGH: {
        textDecoration: 'line-through',
    },

    CODE: {
        backgroundColor: '#e6ffe6',
    },

    SUBSCRIPT: {
        verticalAlign: 'sub',
        fontSize: 'smaller',
    },

    SUPERSCRIPT: {
        verticalAlign: 'super',
        fontSize: 'smaller',
    },
};
