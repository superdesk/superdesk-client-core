import {appConfig} from 'appConfig';
import {customEditorTags} from 'apps/workspace/content/components/get-content-profiles-form-config';
import {assertNever} from 'core/helpers/typescript-helpers';

const getUiFrameworkColor = (borderColor: typeof appConfig.authoring.customEditorTags[0]['borderColor']) => {
    if (borderColor === 'tag-color-1') {
        return 'var(--sd-editor-colour__mark-people, blue)';
    } else if (borderColor === 'tag-color-2') {
        return 'var(--sd-editor-colour__mark-company, purple)';
    } else {
        assertNever(borderColor);
    }
};

export const CUSTOM_EDITOR_TAG_ATTR = 'custom-editor-tag-id';

/**
 * CSS fingerprint properties for custom editor tag styles.
 * These are the properties used to identify custom tag styles in clipboard HTML
 * when pasting across editors or windows. Excludes presentational-only properties
 * like `display` that are too generic to serve as unique identifiers.
 */
export const customEditorTagStyleMap: Record<string, React.CSSProperties> = Object.fromEntries(
    customEditorTags.map(({editor3Style, borderColor}) => [
        editor3Style,
        {borderBlockEnd: `4px double ${getUiFrameworkColor(borderColor)}`},
    ]),
);

export const customStyleMap = {
    ...Object.fromEntries(
        Object.entries(customEditorTagStyleMap).map(([style, props]) => [
            style,
            {display: 'inline-block', ...props},
        ]),
    ),

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
