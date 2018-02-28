import {RichUtils} from 'draft-js';
import {highlightsConfig} from '../highlightsConfig';
import {editor3DataKeys, getCustomDataFromEditor, setCustomDataForEditor} from './editor3CustomData';

export const availableHighlights = Object.keys(highlightsConfig).reduce((obj, key) => {
    obj[key] = highlightsConfig[key].draftStyleMap;
    return obj;
}, {});

function getInitialHighlightsState() {
    return {
        highlightsStyleMap: {},
        highlightsData: {},
        lastHighlightIds: Object.keys(availableHighlights).reduce((obj, key) => {
            obj[key] = 0;
            return obj;
        }, {})
    };
}

export function getHighlightsState(editorState) {
    return getCustomDataFromEditor(editorState, editor3DataKeys.MULTIPLE_HIGHLIGHTS)
        || getInitialHighlightsState();
}

export function setHighlightsState(editorState, hightlightsState) {
    return setCustomDataForEditor(editorState, editor3DataKeys.MULTIPLE_HIGHLIGHTS, hightlightsState);
}

function getHighlightTypeFromStyle(style) {
    const delimiterIndex = style.lastIndexOf('-');

    if (delimiterIndex === -1) {
        null;
    }

    const type = style.slice(0, delimiterIndex);

    if (Object.keys(availableHighlights).includes(type)) {
        return type;
    }

    return null;
}

/**
 * @ngdoc method
 * @name getHighlightStyleAtOffset
 * @param {Object} editorState
 * @param {List} types
 * @param {Object} selection
 * @param {Integer} offset
 * @description the entity key from the new possition specified by offset.
 */
export function getHighlightStyleAtOffset(editorState, types, selection, offset) {
    const content = editorState.getCurrentContent();
    const {block, newOffset} = getBlockAndOffset(content, selection, offset);

    if (block == null) {
        return null;
    }

    const inlineStyles = block.getInlineStyleAt(newOffset);
    let highlightStyle = null;

    inlineStyles.forEach((style) => {
        const type = getHighlightTypeFromStyle(style);

        if (type != null && types.indexOf(type) !== -1) {
            highlightStyle = style;
        }
    });

    return highlightStyle;
}

export function getHighlightStyle(editorState, types) {
    const selection = editorState.getSelection();

    return getHighlightStyleAtOffset(editorState, types, selection, 0);
}

/**
 * @ngdoc method
 * @name getHighlightData
 * @param {Object} editorstate
 * @return {String} style
 * @description returns the data associated to the style.
 */
export function getHighlightData(editorState, style) {
    const highlightsState = getHighlightsState(editorState);

    return highlightsState.highlightsData[style];
}

/**
 * @ngdoc method
 * @name getHighlightDataAtOffset
 * @param {Object} content
 * @param {Object} selection
 * @param {Integer} offset
 * @return {String} entity key
 * @description the entity key from the new possition specified by offset.
 */
export function getHighlightDataAtOffset(editorState, types, selection, offset) {
    const style = getHighlightStyleAtOffset(editorState, types, selection, offset);

    if (style == null) {
        return null;
    }

    const highlightsState = getHighlightsState(editorState);

    return highlightsState.highlightsData[style];
}

/**
 * @ngdoc method
 * @name addHighlightData
 * @param {Object} editorState
 * @param {String} type
 * @param {Object} data
 * @return {Object} new editor state
 * @description add a new highlight at the cussrnt selection.
 */
export function addHighlightData(editorState, type, data) {
    const highlightsState = getHighlightsState(editorState);
    const styleName = type + '-' + (highlightsState.lastHighlightIds[type] + 1);

    const newHighlightsState = {
        lastHighlightIds: {
            ...highlightsState.lastHighlightIds,
            [type]: highlightsState.lastHighlightIds[type] + 1
        },
        highlightsStyleMap: {
            ...highlightsState.highlightsStyleMap,
            [styleName]: availableHighlights[type]
        },
        highlightsData: {
            ...highlightsState.highlightsData,
            [styleName]: {
                ...data,
                type
            }
        }
    };

    const newEditorState = RichUtils.toggleInlineStyle(editorState, styleName);

    return setHighlightsState(newEditorState, newHighlightsState);
}

/**
 * @ngdoc method
 * @name deleteHighlight
 * @param {Object} editorState
 * @param {String} style
 * @return {Object editorstate
 * @description the entity key from the new possition specified by offset.
 */
export function deleteHighlight(editorState, style) {
    // TODO: delete the style re: data if it is not used anymore

    return RichUtils.toggleInlineStyle(editorState, style);
}

/**
 * @ngdoc method
 * @name getCharByOffset
 * @param {Object} content
 * @param {Object} selection
 * @param {Integer} offset
 * @return {Char} return char
 * @description the char from the new possition specified by offset.
 */
export function getCharByOffset(editorState, selection, offset) {
    const content = editorState.getCurrentContent();
    const {block, newOffset} = getBlockAndOffset(content, selection, offset);

    if (block == null) {
        return null;
    }

    return block.getText()[newOffset];
}

/**
 * @ngdoc method
 * @name getBlockAndOffset
 * @param {Object} content
 * @param {Object} selection
 * @param {Integer} offset
 * @return {Object} return block and offset at new position
 * @description find the block and offset for the new position specified by offset.
 */
const getBlockAndOffset = (content, selection, offset) => {
    let newOffset = selection.getStartOffset() + offset;
    let block = content.getBlockForKey(selection.getStartKey());

    if (block == null) {
        return [null, null];
    }

    while (newOffset < 0) {
        block = content.getBlockBefore(block.getKey());
        if (block == null) {
            return [null, null];
        }
        newOffset = block.getLength() - 1 + newOffset;
    }

    while (newOffset > block.getLength()) {
        newOffset = newOffset - block.getLength();
        block = content.getBlockAfter(block.getKey());
        if (block == null) {
            return [null, null];
        }
    }

    return {block, newOffset};
};


export function getRangeAndTextForStyle(editorState, style) {
    const selection = editorState.getSelection();

    if (selection.isCollapsed() === false) {
        throw new Error('Only collapsed selection supported');
    }

    var blockKey = selection.getAnchorKey();
    var block = editorState.getCurrentContent().getBlockForKey(blockKey);
    var characterLists = block.getCharacterList();

    var from = null;
    var to = null;

    // check backwards
    for (let i = selection.getAnchorOffset(); i >= 0; i--) {
        const characterList = characterLists.get(i);

        if (characterList.hasStyle(style)) {
            from = i;
        } else {
            break;
        }
    }

    // check forward
    for (let i = selection.getAnchorOffset(); i < block.getLength(); i++) {
        const characterList = characterLists.get(i);

        if (characterList.hasStyle(style)) {
            to = i;
        } else {
            break;
        }
    }

    const newSelection = selection.merge({
        anchorOffset: from,
        focusOffset: to + 1,
        isBackward: false
    });
    const suggestionText = block.getText().slice(from, to + 1);

    return {
        selection: newSelection,
        suggestionText: suggestionText
    };
}
