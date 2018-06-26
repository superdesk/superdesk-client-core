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
        payload: blockType,
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
        payload: inlineStyle,
    };
}

/**
 * @ngdoc method
 * @name applyLink
 * @param {Object} linkAndEntity
 * @return {String} action
 * @description Returns the action for applying links to text selections.
 */
export function applyLink(link, entity = null) {
    return {
        type: 'TOOLBAR_APPLY_LINK',
        payload: {link, entity},
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

export function removeFormat() {
    return {type: 'TOOLBAR_REMOVE_FORMAT'};
}

/**
 * @ngdoc method
 * @name insertMedia
 * @param {Array} files to be uploaded and inserted
 * @return {String} action
 * @description Displays the external upload dialog and returns the insert media
 * action.
 */
export function insertMedia(files) {
    const superdesk = ng.get('superdesk');

    return (dispatch) => {
        superdesk.intent('upload', 'media', files).then((media) => {
            dispatch({
                type: 'TOOLBAR_INSERT_MEDIA',
                payload: media,
            });
        });
    };
}

/**
 * @ngdoc method
 * @name cropImage
 * @param {String} entityKey
 * @param {Object} entityData
 * @param {Object} options
 * @return {String} action
 * @description Displays the external crop image dialog and returns the crop image
 * action using data from the provided entity.
 */
export function cropImage(entityKey, entityData, options) {
    const renditions = ng.get('renditions');
    const {media} = entityData;

    return (dispatch) => {
        renditions.crop(media, options).then((cropped) => {
            dispatch({
                type: 'TOOLBAR_UPDATE_IMAGE',
                payload: {
                    entityKey: entityKey,
                    media: cropped,
                },
            });
        });
    };
}

/**
 * @ngdoc method
 * @name removeBlock
 * @param {String} blockKey
 * @return {String} action
 * @description Removes a media block
 */

export function removeBlock(blockKey) {
    return {
        type: 'TOOLBAR_REMOVE_BLOCK',
        payload: {
            blockKey,
        },
    };
}

/**
 * @ngdoc method
 * @name toggleInvisibles
 * @return {String} action
 * @description Toggles paragraph marks on body
 */
export function toggleInvisibles() {
    return {type: 'TOOLBAR_TOGGLE_INVISIBLES'};
}

/**
 * @ngdoc method
 * @name embed
 * @param {Object|string} oEmbed code, HTML string.
 * @return {Object}
 * @description Dispatches the action to use the given oEmbed data for media embedding.
 */
export function embed(code) {
    return {
        type: 'TOOLBAR_APPLY_EMBED',
        payload: code,
    };
}
