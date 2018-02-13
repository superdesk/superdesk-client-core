import ng from 'core/services/ng';

/**
 * @ngdoc method
 * @name toggleSuggestingMode
 * @return {String} action
 * @description Enable/disable suggestions mode.
 */
export function toggleSuggestingMode() {
    return {
        type: 'TOGGLE_SUGGESTING_MODE'
    };
}

/**
 * @ngdoc method
 * @name createAddSuggestion
 * @param {String} chars
 * @return {Object} action
 * @description add a new suggestion of type ADD.
 */
export function createAddSuggestion(chars) {
    return {
        type: 'CREATE_ADD_SUGGESTION',
        payload: {
            text: chars,
            data: getSuggestionMetadata()
        }
    };
}

/**
 * @ngdoc method
 * @name createDeleteSuggestion
 * @return {Object} action
 * @description add a new suggestion of type DELETE.
 */
export function createDeleteSuggestion(action) {
    return {
        type: 'CREATE_DELETE_SUGGESTION',
        payload: {
            action: action,
            data: getSuggestionMetadata()
        }
    };
}

/**
 * @ngdoc method
 * @name onPasteFromSuggestingMode
 * @param {Object} content, pasted editor content
 * @return {Object} action
 * @description add a new suggestion of type ADD based on pasted content.
 */
export function onPasteFromSuggestingMode(content) {
    return {
        type: 'PASTE_ADD_SUGGESTION',
        payload: {
            content: content,
            data: getSuggestionMetadata()
        }
    };
}

/**
 * @ngdoc method
 * @name getSuggestionMetadata
 * @param {String} type
 * @return {Object} returns suggestion metadata
 * @description Creates data structure with info about current user and current date.
 */
const getSuggestionMetadata = () => {
    const data = {};
    const date = new Date();

    data.author = ng.get('session').identity._id;
    data.date = date;

    return data;
};
