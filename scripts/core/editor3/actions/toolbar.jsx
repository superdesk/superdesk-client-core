import ng from 'core/services/ng';

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

/**
 * @ngdoc method
 * @name insertImages
 * @return {String} action
 * @description Displays the external upload dialog and returns the insert images
 * action.
 */
export function insertImages() {
    const superdesk = ng.get('superdesk');

    return (dispatch) => {
        superdesk.intent('upload', 'media').then((imgs) => {
            dispatch({
                type: 'TOOLBAR_INSERT_IMAGES',
                payload: imgs
            });
        });
    };
}

/**
 * @ngdoc method
 * @name cropImage
 * @param {String} entityKey
 * @param {Object} entityData
 * @return {String} action
 * @description Displays the external crop image dialog and returns the crop image
 * action using data from the provided entity.
 */
export function cropImage(entityKey, entityData) {
    const renditions = ng.get('renditions');
    const {img} = entityData;

    return (dispatch) => {
        renditions.crop(img).then((cropped) => {
            dispatch({
                type: 'TOOLBAR_UPDATE_IMAGE',
                payload: {
                    entityKey: entityKey,
                    img: cropped
                }
            });
        });
    };
}

/**
 * @ngdoc method
 * @name embedURL
 * @return {Object} oEmbed
 * @description Dispatches the action to use the given oEmbed data for media embedding.
 */
export function embed(oEmbed) {
    return {
        type: 'TOOLBAR_APPLY_EMBED',
        payload: oEmbed
    };
}

/**
 * @ngdoc method
 * @name addTable
 * @param {Number} w Width (columns) of the table.
 * @return {Number} h Height (rows) of the table.
 * @description Dispatches the action that adds a table into the content.
 */
export function addTable(w, h) {
    const cells = [];

    return {
        type: 'TOOLBAR_ADD_TABLE',
        payload: {w, h, cells}
    };
}
