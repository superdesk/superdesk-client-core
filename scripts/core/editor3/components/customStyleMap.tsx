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

export const customStyleMap = {
    ...Object.fromEntries(
        customEditorTags.map(({editor3Style, borderColor}) => [
            editor3Style,
            {display: 'inline-block', borderBlockEnd: `4px double ${getUiFrameworkColor(borderColor)}`},
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
