import ng from 'core/services/ng';

/**
 * @ngdoc method
 * @name applyComment
 * @param {SelectionState} s Selection that the comment applies to.
 * @param {string} msg Comment body.
 * @return {String} action
 * @description Triggers the action to add a comment to the given selection.
 */
export const applyComment = (s, data) => applyHighlight('COMMENT', s, data);

/**
 * @ngdoc method
 * @name applyAnnotation
 * @param {SelectionState} sel Selection that the annotation applies to.
 * @param {string} msg Annotation body.
 * @return {String} action
 * @description Triggers the action to add a comment to the given selection.
 */
export const applyAnnotation = (s, data) => applyHighlight('ANNOTATION', s, data);

/**
 * @ngdoc method
 * @name deleteHighlight
 * @param {Highlight} h
 * @return {String} action
 * @description Deletes the given highlight from the content.
 */
export const deleteHighlight = (h) => ({type: 'DELETE_HIGHLIGHT', payload: h});

// applyHighlights creates an action that applies the highlight of the given type to
// selection and contains the given meta data.
function applyHighlight(type, selection, data) {
    const date = new Date();
    const {display_name: author, email, picture_url: avatar} = ng.get('session').identity;

    data.author = author;
    data.email = email;
    data.date = date;
    data.avatar = avatar;
    data.type = type;

    return {
        type: 'TOOLBAR_ADD_HIGHLIGHT',
        payload: {data, selection}
    };
}
