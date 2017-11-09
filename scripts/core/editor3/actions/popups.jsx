/**
 * @typedef PopupMeta
 * @property {Key<PopupType>} type Popup type
 * @property {Object} data Information required by this popup type (for example
 * a selection for adding the comment or annotation too)
 */

export const PopupTypes = {
    Hidden: 'NONE',
    Annotation: 'ANNOTATION',
    Comment: 'COMMENT',
    Link: 'LINK',
    Embed: 'EMBED'
};

/**
 * @name showPopup
 * @param {PopupTypes} type The type of pop-up to show.
 * @param {Object} data Data to pass to the popup.
 * @description Triggers the action to show the popup of the given type having the
 * given data attached.
 * @return {Object}
 */
export function showPopup(type, data) {
    return {
        type: 'TOOLBAR_SET_POPUP',
        payload: {type, data}
    };
}

/**
 * @name hidePopup
 * @description Hides any active toolbar popup.
 * @return {Object}
 */
export function hidePopups() {
    return showPopup(PopupTypes.Hidden);
}
