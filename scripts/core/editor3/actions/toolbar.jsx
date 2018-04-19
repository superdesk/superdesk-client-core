import ng from 'core/services/ng';
import json5 from 'json5';

// String identifying embed codes that are Qumu widgets.
const QumuString = 'KV.widget({';

// https://gist.github.com/jed/982883
function uuid(a) {
    return a // if the placeholder was passed, return
        ? ( // a random number from 0 to 15
            a ^ // unless b is 8,
        Math.random() // in which case
        * 16 // a random number from
        >> a / 4 // 8 to 11
        ).toString(16) // in hexadecimal
        : ( // or otherwise a concatenated string:
            [1e7] + // 10000000 +
        -1e3 + // -1000 +
        -4e3 + // -4000 +
        -8e3 + // -80000000 +
        -1e11 // -100000000000,
        ).replace( // replacing
            /[018]/g, // zeroes, ones, and eights with
            uuid // random hex digits
        );
}

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
 * @return {String} action
 * @description Displays the external crop image dialog and returns the crop image
 * action using data from the provided entity.
 */
export function cropImage(entityKey, entityData) {
    const renditions = ng.get('renditions');
    const {media} = entityData;

    return (dispatch) => {
        renditions.crop(media).then((cropped) => {
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
 * @param {Object|string} oEmbed code, HTML string or Qumu widget config.
 * @return {Object}
 * @description Dispatches the action to use the given oEmbed data for media embedding.
 */
export function embed(code) {
    return {
        type: 'TOOLBAR_APPLY_EMBED',
        payload: parseEmbed(code),
    };
}

// Parses the embed code and processes a potential Qumu widget string.
function parseEmbed(code) {
    if (typeof code !== 'string') {
        return code; // oEmbed code
    }

    const {features} = ng.get('config');
    const isQumuWidget = features.qumu && code.indexOf(QumuString) > -1;

    if (!isQumuWidget) {
        return code; // HTML string
    }

    const startIndex = code.indexOf(QumuString) + QumuString.length - 1;
    const configString = code.slice(startIndex, code.lastIndexOf('}') + 1);

    return _.extend(
        json5.parse(configString),
        {
            selector: `#qumu-${uuid()}`,
            qumuWidget: true,
        }
    ); // Qumu widget
}
