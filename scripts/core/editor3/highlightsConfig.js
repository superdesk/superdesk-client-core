// dummy function to make the highlights description accesible as keys for translation
function gettext(text) {
    return text;
}

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
        type: 'CHANGE',
        description: gettext('Add'),
        draftStyleMap: {
            color: 'rgba(0, 180, 0, 1.0)'
        }
    },
    DELETE_SUGGESTION: {
        type: 'CHANGE',
        description: gettext('Remove'),
        draftStyleMap: {
            color: 'rgba(255, 0, 0, 1.0)',
            textDecoration: 'line-through'
        }
    },
    TOGGLE_BOLD_SUGGESTION: {
        type: 'STYLE',
        style: 'BOLD',
        description: gettext('Toggle bold'),
        draftStyleMap: {
            backgroundColor: 'rgba(100, 235, 59, 0.2)'
        }
    },
    TOGGLE_ITALIC_SUGGESTION: {
        type: 'STYLE',
        style: 'ITALIC',
        description: gettext('Toggle italic'),
        draftStyleMap: {
            backgroundColor: 'rgba(100, 235, 59, 0.2)'
        }
    },
    TOGGLE_UNDERLINE_SUGGESTION: {
        type: 'STYLE',
        style: 'UNDERLINE',
        description: gettext('Toggle underline'),
        draftStyleMap: {
            backgroundColor: 'rgba(100, 235, 59, 0.2)'
        }
    }
};

export const changeSuggestionsTypes = ['DELETE_SUGGESTION', 'ADD_SUGGESTION'];
export const styleSuggestionsTypes = Object.keys(highlightsConfig).filter(
    (key) => highlightsConfig[key].type === 'STYLE'
);

export const suggestionsTypes = [...changeSuggestionsTypes, ...styleSuggestionsTypes];
