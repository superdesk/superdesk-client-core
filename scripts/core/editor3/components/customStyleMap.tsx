import {appConfig} from 'appConfig';
import {assertNever} from 'core/helpers/typescript-helpers';

const getUiFrameworkColor = (borderColor: typeof appConfig.authoring.customEditorTags[0]['borderColor']) => {
    // TODO: Fix the conversion so it returns UI framework color variables, that work in dark and light themes
    if (borderColor === 'blue') {
        return 'blue';
    } else if (borderColor === 'orange') {
        return 'orange';
    } else if (borderColor === 'purple') {
        return 'purple';
    } else {
        assertNever(borderColor);
    }
};

export const customStyleMap = {
    ...Object.fromEntries(
        (appConfig.authoring?.customEditorTags ?? []).map(({id, borderColor}) => [
            id, {display: 'inline-block', borderBlockEnd: `4px double ${getUiFrameworkColor(borderColor)}`},
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
        backgroundColor: 'rgba(255, 235, 59, 0.2)',
    },

    COMMENT_SELECTED: {
        backgroundColor: 'rgba(255, 235, 59, 0.6)',
    },

    ANNOTATION: {
        borderBlockEnd: '4px solid rgba(100, 205, 0, 0.6)',
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
