// dummy function to make the highlights description accesible as keys for translation
function gettext(text) {
    return text;
}

export const highlightsConfig = {
    COMMENT: {
        type: 'COMMENT',
        draftStyleMap: {
            backgroundColor: 'rgba(255, 235, 59, 0.2)',
        },
    },
    ANNOTATION: {
        type: 'ANNOTATION',
        draftStyleMap: {
            borderBottom: '4px solid rgba(100, 205, 0, 0.6)',
        },
    },
    ADD_SUGGESTION: {
        type: 'CHANGE',
        description: gettext('Add'),
        draftStyleMap: {
            color: 'rgba(0, 180, 0, 1.0)',
        },
    },
    DELETE_SUGGESTION: {
        type: 'CHANGE',
        description: gettext('Remove'),
        draftStyleMap: {
            color: 'rgba(255, 0, 0, 1.0)',
            textDecoration: 'line-through',
        },
    },
    TOGGLE_BOLD_SUGGESTION: {
        type: 'STYLE',
        style: 'BOLD',
        description: gettext('Toggle bold'),
        draftStyleMap: {
            backgroundColor: 'rgba(100, 235, 59, 0.2)',
        },
    },
    TOGGLE_ITALIC_SUGGESTION: {
        type: 'STYLE',
        style: 'ITALIC',
        description: gettext('Toggle italic'),
        draftStyleMap: {
            backgroundColor: 'rgba(100, 235, 59, 0.2)',
        },
    },
    TOGGLE_UNDERLINE_SUGGESTION: {
        type: 'STYLE',
        style: 'UNDERLINE',
        description: gettext('Toggle underline'),
        draftStyleMap: {
            backgroundColor: 'rgba(100, 235, 59, 0.2)',
        },
    },
    BLOCK_STYLE_SUGGESTION: {
        type: 'BLOCK',
        description: gettext('Toggle'),
        draftStyleMap: {
            backgroundColor: 'rgba(100, 235, 59, 0.2)',
        },
    },
    SPLIT_PARAGRAPH_SUGGESTION: {
        type: 'SPLIT',
        description: gettext('Split paragraph'),
        draftStyleMap: {
            backgroundColor: 'rgba(100, 235, 59, 0.2)',
        },
    },
    ADD_LINK_SUGGESTION: {
        type: 'ENTITY',
        description: gettext('Add link'),
        draftStyleMap: {
            backgroundColor: 'rgba(100, 235, 59, 0.2)',
        },
    },
};

export const blockStylesDescription = {
    'header-one': 'H1',
    'header-two': 'H2',
    'header-three': 'H3',
    'header-four': 'H4',
    'header-five': 'H5',
    'header-six': 'H6',
    blockquote: gettext('quote'),
    'unordered-list-item': gettext('unordered list'),
    'ordered-list-item': gettext('ordered list'),
};

export const changeSuggestionsTypes = ['DELETE_SUGGESTION', 'ADD_SUGGESTION'];
export const styleSuggestionsTypes = Object.keys(highlightsConfig).filter(
    (key) => highlightsConfig[key].type === 'STYLE'
);

export const suggestionsTypes = [
    ...changeSuggestionsTypes,
    ...styleSuggestionsTypes,
    'BLOCK_STYLE_SUGGESTION',
    'SPLIT_PARAGRAPH_SUGGESTION',
    'ADD_LINK_SUGGESTION',
];

export const isSuggestion = (highlightId) => suggestionsTypes.some(
    (suggestionType) => highlightId.indexOf(suggestionType) === 0
);
