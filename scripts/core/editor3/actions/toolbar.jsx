/**
 * @ngdoc method
 * @name toggleBlockStyle
 * @param {String} blockType Type of block styling to toggle.
 * @return {String} action
 * @description Returns the block style toggling action.
 */
export function toggleBlockStyle(blockType) {
    return {
        type: 'TOOLBAR_TOGGLE_BLOCK_STYLE',
        payload: blockType
    };
}

/**
 * @ngdoc method
 * @name toggleInlineStyle
 * @param {String} inlineStyle Type of inline styling to toggle.
 * @return {String} action
 * @description Returns the inline style toggling action.
 */
export function toggleInlineStyle(inlineStyle) {
    return {
        type: 'TOOLBAR_TOGGLE_INLINE_STYLE',
        payload: inlineStyle
    };
}

/**
 * @ngdoc method
 * @name applyLink
 * @param {Object} urlAndEntity
 * @return {String} action
 * @description Returns the action for applying links to text selections.
 */
export function applyLink({url, entity}) {
    return {
        type: 'TOOLBAR_APPLY_LINK',
        payload: {url, entity}
    };
}

/**
 * @ngdoc method
 * @name removeLink
 * @return {String} action
 * @description Returns the action for removing a link under the cursor.
 */
export function removeLink() {
    return {type: 'TOOLBAR_REMOVE_LINK'};
}

