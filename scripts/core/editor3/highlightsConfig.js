export const highlightsConfig = {
    COMMENT: {
        type: 'COMMENT',
        draftStyleMap: {
            backgroundColor: 'rgba(255, 235, 59, 0.2)'
        }
    },
    ANNOTATION: {
        type: 'ANNOTATION',
        draftStyleMap: {
            borderBottom: '4px solid rgba(100, 205, 0, 0.6)'
        }
    },
    ADD_SUGGESTION: {
        type: 'ADD_SUGGESTION',
        draftStyleMap: {
            color: 'rgba(0, 180, 0, 1.0)'
        }
    },
    DELETE_SUGGESTION: {
        type: 'DELETE_SUGGESTION',
        draftStyleMap: {
            color: 'rgba(255, 0, 0, 1.0)',
            textDecoration: 'line-through'
        }
    },
    TOGGLE_BOLD_SUGGESTION: {
        type: 'TOGGLE_BOLD_SUGGESTION',
        draftStyleMap: {
            backgroundColor: 'rgba(100, 235, 59, 0.2)'
        }
    },
    TOGGLE_ITALIC_SUGGESTION: {
        type: 'TOGGLE_ITALIC_SUGGESTION',
        draftStyleMap: {
            backgroundColor: 'rgba(100, 235, 59, 0.2)'
        }
    },
    TOGGLE_UNDERLINE_SUGGESTION: {
        type: 'TOGGLE_UNDERLINE_SUGGESTION',
        draftStyleMap: {
            backgroundColor: 'rgba(100, 235, 59, 0.2)'
        }
    }
};

export const suggestionsTypes = ['DELETE_SUGGESTION', 'ADD_SUGGESTION'];
export const styleSuggestionsTypes = ['TOGGLE_BOLD_SUGGESTION', 'TOGGLE_ITALIC_SUGGESTION',
    'TOGGLE_UNDERLINE_SUGGESTION'];
export const allSuggestionsTypes = [...suggestionsTypes, ...styleSuggestionsTypes];
