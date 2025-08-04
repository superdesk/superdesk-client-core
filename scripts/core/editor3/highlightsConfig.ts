import {gettext} from 'core/utils';

const REMOVE_SUGGESTION_STYLE_MAP = {
    backgroundColor: 'var(--sd-editor-colour__removing-bg)',
    color: 'var(--sd-editor-colour__removing)',
};

export function getHighlightsConfig() {
    return {
        COMMENT: {
            type: 'COMMENT',
            description: gettext('Comment'),
            draftStyleMap: {
                backgroundColor: 'var(--sd-editor-colour__comment-bg)',
            },
        },
        ANNOTATION: {
            type: 'ANNOTATION',
            description: gettext('Annotation'),
            draftStyleMap: {
                borderBottom: '4px solid var(--sd-editor-colour__adding)',
            },
        },
        ADD_SUGGESTION: {
            type: 'CHANGE',
            description: gettext('Add'),
            draftStyleMap: {
                color: 'var(--sd-editor-colour__adding)',
                backgroundColor: 'var(--sd-editor-colour__adding-bg)',
            },
        },
        DELETE_SUGGESTION: {
            type: 'CHANGE',
            description: gettext('Remove'),
            draftStyleMap: {
                textDecoration: 'line-through',
                ...REMOVE_SUGGESTION_STYLE_MAP,
            },
        },
        TOGGLE_BOLD_SUGGESTION: {
            type: 'STYLE',
            style: 'BOLD',
            description: gettext('Toggle bold'),
            draftStyleMap: REMOVE_SUGGESTION_STYLE_MAP,
        },
        TOGGLE_ITALIC_SUGGESTION: {
            type: 'STYLE',
            style: 'ITALIC',
            description: gettext('Toggle italic'),
            draftStyleMap: REMOVE_SUGGESTION_STYLE_MAP,
        },
        TOGGLE_UNDERLINE_SUGGESTION: {
            type: 'STYLE',
            style: 'UNDERLINE',
            description: gettext('Toggle underline'),
            draftStyleMap: REMOVE_SUGGESTION_STYLE_MAP,
        },
        TOGGLE_SUBSCRIPT_SUGGESTION: {
            type: 'STYLE',
            style: 'SUBSCRIPT',
            description: gettext('Toggle subscript'),
            draftStyleMap: REMOVE_SUGGESTION_STYLE_MAP,
        },
        TOGGLE_SUPERSCRIPT_SUGGESTION: {
            type: 'STYLE',
            style: 'SUPERSCRIPT',
            description: gettext('Toggle superscript'),
            draftStyleMap: REMOVE_SUGGESTION_STYLE_MAP,
        },
        TOGGLE_STRIKETHROUGH_SUGGESTION: {
            type: 'STYLE',
            style: 'STRIKETHROUGH',
            description: gettext('Toggle strikethrough'),
            draftStyleMap: REMOVE_SUGGESTION_STYLE_MAP,
        },
        BLOCK_STYLE_SUGGESTION: {
            type: 'BLOCK',
            description: gettext('Toggle'),
            draftStyleMap: REMOVE_SUGGESTION_STYLE_MAP,
        },
        SPLIT_PARAGRAPH_SUGGESTION: {
            type: 'SPLIT',
            description: gettext('Split paragraph'),
            draftStyleMap: {
                color: 'rgba(0, 180, 0, 1.0)',
                fontWeight: 'bold',
                fontFamily: 'sans-serif',
            },
        },
        MERGE_PARAGRAPHS_SUGGESTION: {
            type: 'MERGE',
            description: gettext('Merge paragraphs'),
            draftStyleMap: {
                color: 'rgba(255, 0, 0, 1.0)',
                textDecoration: 'line-through',
                fontWeight: 'bold',
                fontFamily: 'sans-serif',
            },
        },
        DELETE_EMPTY_PARAGRAPH_SUGGESTION: {
            type: 'DELETE',
            description: gettext('Delete empty paragraphs'),
            draftStyleMap: {
                color: 'rgba(255, 0, 0, 1.0)',
                textDecoration: 'line-through',
                fontWeight: 'bold',
                fontFamily: 'sans-serif',
            },
        },
        ADD_LINK_SUGGESTION: {
            type: 'ENTITY',
            description: gettext('Add link'),
            draftStyleMap: {
                backgroundColor: 'var(--sd-editor-colour__adding-bg)',
            },
        },
        REMOVE_LINK_SUGGESTION: {
            type: 'ENTITY',
            description: gettext('Remove link'),
            draftStyleMap: REMOVE_SUGGESTION_STYLE_MAP,
        },
        CHANGE_LINK_SUGGESTION: {
            type: 'ENTITY',
            description: gettext('Edit link'),
            draftStyleMap: REMOVE_SUGGESTION_STYLE_MAP,
        },
    };
}

export const DELETE_SUGGESTION = 'DELETE_SUGGESTION';
export const ADD_SUGGESTION = 'ADD_SUGGESTION';
export const changeSuggestionsTypes = [DELETE_SUGGESTION, ADD_SUGGESTION];

export function getStyleSuggestionsTypes() {
    const highlightsConfig = getHighlightsConfig();

    return Object.keys(highlightsConfig).filter(
        (key) => highlightsConfig[key].type === 'STYLE',
    );
}

export const blockSuggestionTypes = [
    'BLOCK_STYLE_SUGGESTION',
];

export const paragraphSuggestionTypes = [
    'SPLIT_PARAGRAPH_SUGGESTION',
    'MERGE_PARAGRAPHS_SUGGESTION',
];

export function getSuggestionsTypes() {
    return [
        ...changeSuggestionsTypes,
        ...getStyleSuggestionsTypes(),
        ...blockSuggestionTypes,
        ...paragraphSuggestionTypes,
        'ADD_LINK_SUGGESTION',
        'REMOVE_LINK_SUGGESTION',
        'CHANGE_LINK_SUGGESTION',
    ];
}

export const isSuggestion = (highlightId) => getSuggestionsTypes().some(
    (suggestionType) => highlightId.indexOf(suggestionType) === 0,
);

export const isComment = (highlightId) => highlightId.startsWith(getHighlightsConfig().COMMENT.type);
