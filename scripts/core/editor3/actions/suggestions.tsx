import ng from 'core/services/ng';

/**
 * @ngdoc method
 * @name toggleSuggestingMode
 * @return {String} action
 * @description Enable/disable suggestions mode.
 */
export function toggleSuggestingMode() {
    return {
        type: 'TOGGLE_SUGGESTING_MODE',
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
            data: getSuggestionMetadata(),
        },
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
            data: getSuggestionMetadata(),
        },
    };
}

/**
 * @ngdoc method
 * @name createChangeStyleSuggestion
 * @param {String} style
 * @param {String} active, true if style was active
 * @return {Object} action
 * @description add a new suggestion of type change style.
 */
export function createChangeStyleSuggestion(style, active) {
    return {
        type: 'CREATE_CHANGE_STYLE_SUGGESTION',
        payload: {
            style: style,
            data: {
                ...getSuggestionMetadata(),
                originalStyle: active ? style : '',
            },
        },
    };
}

/**
 * @ngdoc method
 * @name createChangeBlockStyleSuggestion
 * @param {String} type
 * @param {String} active, true if type was active
 * @return {Object} action
 * @description add a new suggestion of type change block style.
 */
export function createChangeBlockStyleSuggestion(type, active) {
    return {
        type: 'CREATE_CHANGE_BLOCK_STYLE_SUGGESTION',
        payload: {
            blockType: type,
            data: {
                ...getSuggestionMetadata(),
                originalStyle: active ? type : '',
            },
        },
    };
}

/**
 * @ngdoc method
 * @name createSplitParagraphSuggestion
 * @param {String} blockKey
 * @param {String} blockOffset
 * @return {Object} action
 * @description add a new suggestion of type split paragraph.
 */
export function createSplitParagraphSuggestion(blockKey, blockOffset) {
    return {
        type: 'CREATE_SPLIT_PARAGRAPH_SUGGESTION',
        payload: {
            data: getSuggestionMetadata(),
        },
    };
}

/**
 * @ngdoc method
 * @name acceptSuggestion
 * @param {Object} selection
 * @return {Object} action
 * @description accept the suggestions for the selection.
 */
export function acceptSuggestion(suggestion) {
    return {
        type: 'ACCEPT_SUGGESTION',
        payload: {
            suggestion: suggestion,
            data: getSuggestionMetadata(),
        },
    };
}

/**
 * @ngdoc method
 * @name rejectSuggestion
 * @param {Object} selection
 * @return {Object} action
 * @description reject the suggestions for the selection.
 */
export function rejectSuggestion(suggestion) {
    return {
        type: 'REJECT_SUGGESTION',
        payload: {
            suggestion: suggestion,
            data: getSuggestionMetadata(),
        },
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
            data: getSuggestionMetadata(),
        },
    };
}

/**
 * @ngdoc method
 * @name createLinkSuggestion
 * @param {Object} link, object containing the link href
 * @return {Object} action
 * @description add a new suggestion of type ADD link to text
 */
export function createLinkSuggestion(link) {
    return {
        type: 'CREATE_LINK_SUGGESTION',
        payload: {
            data: {
                ...getSuggestionMetadata(),
                link,
            },
        },
    };
}

/**
 * @ngdoc method
 * @name removeLinkSuggestion
 * @return {Object} action
 * @description add a new suggestion of type REMOVE link
 */
export function removeLinkSuggestion() {
    return {
        type: 'REMOVE_LINK_SUGGESTION',
        payload: {
            data: getSuggestionMetadata(),
        },
    };
}

/**
 * @ngdoc method
 * @name changeLinkSuggestion
 * @param {Object} link, object containing the link href
 * @param {Object} entity - the link entity
 * @return {Object} action
 * @description add a new suggestion of type CAHNGE link
 */
export function changeLinkSuggestion(link, entity) {
    return {
        type: 'CHANGE_LINK_SUGGESTION',
        payload: {
            data: getSuggestionMetadata(),
            link: link,
            entity: entity,
        },
    };
}

/**
 * @ngdoc method
 * @name getSuggestionMetadata
 * @param {String} type
 * @return {Object} returns suggestion metadata
 * @description Creates data structure with info about current user and current date.
 */
export const getSuggestionMetadata = () => {
    const data = {};
    const date = new Date();

    data.author = ng.get('session').identity._id;
    data.date = date;

    return data;
};
