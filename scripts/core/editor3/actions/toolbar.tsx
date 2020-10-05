import ng from 'core/services/ng';
import {checkRenditions} from 'apps/authoring/authoring/controllers/AssociationController';

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
export function insertMedia(files?, targetBlockKey = null) {
    const superdesk = ng.get('superdesk');
    const renditions = ng.get('renditions');

    const editedMedia = [];

    return (dispatch) => {
        superdesk.intent('upload', 'media', files).then((mediaList) => {
            const mediaListCopy = [...mediaList];

            function editNext() {
                if (mediaListCopy && Array.isArray(mediaListCopy) && mediaListCopy.length > 0) {
                    const _media = mediaListCopy.shift();
                    const _isImage = checkRenditions.isImage(_media.renditions.original);
                    const options = {
                        isNew: true,
                        editable: true,
                        defaultTab: _isImage ? 'crop' : 'view',
                    };

                    // using setTimeout: wait for already opened modal to get closed so that new modal can be opened.
                    setTimeout(() => {
                        renditions.crop(_media, options).then((cropped) => {
                            editedMedia.push(cropped);
                            editNext();
                        }, (reason) => {
                            if (reason != null && reason.done != null && reason.done === true) {
                                // no crops were set, continue with defaults
                                editedMedia.push(_media);
                                editNext();
                            }
                        });
                    });
                } else {
                    dispatch({
                        type: 'TOOLBAR_INSERT_MEDIA',
                        payload: {files: editedMedia, targetBlockKey: targetBlockKey},
                    });
                }
            }
            editNext();
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
export function cropImage(entityKey, entityData, options = {}) {
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

export function undo() {
    return {type: 'UNDO'};
}

export function redo() {
    return {type: 'REDO'};
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
