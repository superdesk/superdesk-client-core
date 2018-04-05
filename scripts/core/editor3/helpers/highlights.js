import {RichUtils, EditorState, Modifier} from 'draft-js';
import {highlightsConfig} from '../highlightsConfig';
import {editor3DataKeys, getCustomDataFromEditor, setCustomDataForEditor} from './editor3CustomData';
import {getDraftCharacterListForSelection} from './getDraftCharacterListForSelection';
import {getDraftSelectionForEntireContent} from './getDraftSelectionForEntireContent';
import {resizeDraftSelection} from './resizeDraftSelection';
import {clearInlineStyles} from './clearInlineStyles';
import {suggestionsTypes, changeSuggestionsTypes, blockStylesDescription} from '../highlightsConfig';

export const availableHighlights = Object.keys(highlightsConfig).reduce((obj, key) => {
    obj[key] = highlightsConfig[key].draftStyleMap;
    return obj;
}, {});

const mapHighlightTypeToInlineStyle = Object.keys(highlightsConfig).reduce((obj, key) => {
    if (highlightsConfig[key].type === 'STYLE') {
        obj[key] = highlightsConfig[key].style;
    }
    return obj;
}, {});

const mapInlineStyleToHighlightType = Object.keys(highlightsConfig).reduce((obj, key) => {
    if (highlightsConfig[key].type === 'STYLE') {
        obj[highlightsConfig[key].style] = key;
    }
    return obj;
}, {});

export function getTypeByInlineStyle(inlineStyle) {
    return mapInlineStyleToHighlightType[inlineStyle];
}

export function getInlineStyleByType(type) {
    return mapHighlightTypeToInlineStyle[type];
}

export function getHighlightDescription(suggestionsType) {
    const highlight = highlightsConfig[suggestionsType];

    if (highlight != null && highlight.description) {
        return highlight.description;
    }

    return suggestionsType;
}

export function getBlockStylesDescription(blockStyle) {
    if (blockStyle == null || !(blockStyle in blockStylesDescription)) {
        return '';
    }

    return blockStylesDescription[blockStyle];
}

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

function getHighlightsState(editorState) {
    const initialHighlightsState = getInitialHighlightsState();
    const highlightsDataFromEditor = getCustomDataFromEditor(editorState, editor3DataKeys.MULTIPLE_HIGHLIGHTS);

    if (highlightsDataFromEditor == null) {
        return initialHighlightsState;
    }

    const dataFromEditorContainsRequiredKeys = Object.keys(initialHighlightsState)
        .filter((key) => Object.keys(highlightsDataFromEditor).includes(key) === false)
        .length === 0;

    if (dataFromEditorContainsRequiredKeys === false) {
        return initialHighlightsState;
    }

    return highlightsDataFromEditor;
}

function setHighlightsState(editorState, hightlightsState) {
    return setCustomDataForEditor(editorState, editor3DataKeys.MULTIPLE_HIGHLIGHTS, hightlightsState);
}

function getHighlightType(styleName) {
    var delimiterIndex = styleName.lastIndexOf('-');

    if (delimiterIndex === -1) {
        throw new Error('styleName doesn\'t belong to a highlight');
    }

    return styleName.slice(0, delimiterIndex);
}

/**
 * @ngdoc method
 * @name getHighlightsStyleMap
 * @param {Object} editorState
 * @return {Object}
 * @description return the current highlights style map.
 */
export function getHighlightsStyleMap(editorState) {
    const highlightsState = getHighlightsState(editorState);

    return highlightsState.highlightsStyleMap;
}

/**
 * @ngdoc method
 * @name highlightTypeValid
 * @param {String} highlightType
 * @return {Boolean}
 * @description return true if the highlightType is a valid highlight type for current editor.
 */
function highlightTypeValid(highlightType) {
    return Object.keys(availableHighlights).includes(highlightType);
}

/**
 * @ngdoc method
 * @name styleNameBelongsToHighlight
 * @param {String} styleName
 * @return {Boolean}
 * @description return true if the styleName is a valid style for current editor.
 */
export function styleNameBelongsToHighlight(styleName) {
    if (typeof styleName !== 'string') {
        return false;
    }

    var delimiterIndex = styleName.lastIndexOf('-');

    if (delimiterIndex === -1) {
        return false;
    }

    return Object.keys(availableHighlights).includes(styleName.slice(0, delimiterIndex));
}

/**
 * @ngdoc method
 * @name getHighlightTypeFromStyleName
 * @param {String} styleName
 * @return {String}
 * @description return the highlight type for styleName.
 */
export function getHighlightTypeFromStyleName(styleName) {
    if (typeof styleName !== 'string') {
        throw new Error('string expected');
    }

    var delimiterIndex = styleName.lastIndexOf('-');

    if (delimiterIndex === -1) {
        throw new Error('Style name does not contain a highlight type');
    }

    var highlightType = styleName.slice(0, delimiterIndex);

    if (highlightTypeValid(highlightType) === false) {
        throw new Error(`Invalid highlight type '${highlightType}'`);
    }

    return highlightType;
}

/**
 * @ngdoc method
 * @name getHighlightsCount
 * @param {Object} editorState
 * @param {String} styleName
 * @return {String}
 * @description return the number of individual highlights.
 */
export function getHighlightsCount(editorState, highlightType) {
    const highlightsState = getHighlightsState(editorState);

    if (highlightType !== undefined) {
        if (highlightTypeValid(highlightType) === false) {
            throw new Error(`Invalid highlight type '${highlightType}'`);
        }
        return highlightsState.lastHighlightIds[highlightType];
    } else {
        // count highlights of all types
        return Object.keys(highlightsState.lastHighlightIds)
            .reduce((count, key) => count + highlightsState.lastHighlightIds[key], 0);
    }
}

/**
 * @ngdoc method
 * @name canAddHighlight
 * @param {Object} editorState
 * @param {String} highlightType
 * @return {Boolean}
 * @description return true if a highlight of type highlightType can be set
 * for current selection
 */
export function canAddHighlight(editorState, highlightType) {
    if (highlightTypeValid(highlightType) !== true) {
        return false;
    }

    function characterHasAHighlightOfTheSameType(character) {
        if (
            character.getStyle()
                .some((styleName) =>
                    this.styleNameBelongsToHighlight(styleName)
                    && getHighlightType(styleName) === highlightType)
        ) {
            return true;
        }

        return false;
    }

    if (editorState.getSelection().isCollapsed()) {
        return false;
    }

    // selection is expanded to include edges
    // so you can't add a highlight right next to another
    const selection = resizeDraftSelection(
        1,
        1,
        editorState.getSelection(),
        editorState,
        true
    );

    return getDraftCharacterListForSelection(editorState, selection)
        .some(characterHasAHighlightOfTheSameType.bind(this)) === false;
}

/**
 * @ngdoc method
 * @name getHighlightStyleAtOffset
 * @param {Object} editorState
 * @param {List} types
 * @param {Object} selection
 * @param {Integer} offset
 * @description the highlight style from the new possition specified by offset.
 */
export function getHighlightStyleAtOffset(editorState, types, selection, offset, fromEnd = false) {
    const {block, newOffset} = getBlockAndOffset(editorState, selection, offset, fromEnd);

    if (block == null) {
        return null;
    }

    const inlineStyles = block.getInlineStyleAt(newOffset);
    let highlightStyle = null;

    inlineStyles.forEach((style) => {
        if (styleNameBelongsToHighlight(style)) {
            const type = getHighlightTypeFromStyleName(style);

            if (type != null && types.indexOf(type) !== -1) {
                highlightStyle = style;
            }
        }
    });

    return highlightStyle;
}

/**
 * @ngdoc method
 * @name getHighlightStyleAtCurrentPosition
 * @param {Object} editorState
 * @param {List} types
 * @return {String}
 * @description return the style of type for current character position.
 */
export function getHighlightStyleAtCurrentPosition(editorState, types) {
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

    if (highlightsState.highlightsData[style] === undefined) {
        throw new Error('Highlight doesn\'t exist.');
    }

    return highlightsState.highlightsData[style];
}

/**
 * @ngdoc method
 * @name getHighlightAuthor
 * @param {Object} editorstate
 * @return {String} style
 * @description returns the author associated to the style.
 */
export function getHighlightAuthor(editorState, style) {
    const data = getHighlightData(editorState, style);

    if (data == null) {
        return null;
    }

    return data.author;
}

/**
 * @ngdoc method
 * @name getHighlightDataAtOffset
 * @param {Object} editorState
 * @param {Array} types
 * @param {Object} selection
 * @param {Integer} offset
 * @return {Object}
 * @description the highlight associated data from the new possition specified by offset.
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
 * @name getHighlightDataAtCurrentPosition
 * @param {Object} editorState
 * @param {Array} types
 * @return {Object}
 * @description the highlight associated data from current position.
 */
export function getHighlightDataAtCurrentPosition(editorState, types) {
    const selection = editorState.getSelection();

    return getHighlightDataAtOffset(editorState, types, selection, 0);
}

/**
 * @ngdoc method
 * @name addHighlight
 * @param {Object} editorState
 * @param {String} type
 * @param {Object} data
 * @return {Object} new editor state
 * @description add a new highlight for the current selection.
 */
export function addHighlight(editorState, type, data) {
    const highlightsState = getHighlightsState(editorState);

    if (highlightTypeValid(type) !== true) {
        throw new Error('Highlight type invalid');
    }
    let newIndex = 0;

    if (highlightsState.lastHighlightIds && _.has(highlightsState.lastHighlightIds, type)) {
        newIndex = highlightsState.lastHighlightIds[type] + 1;
    }
    const styleName = type + '-' + newIndex;

    const newHighlightsState = {
        lastHighlightIds: {
            ...highlightsState.lastHighlightIds,
            [type]: newIndex
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
 * @name updateHighlightData
 * @param {Object} editorState
 * @param {String} styleName
 * @param {Object} nextData
 * @return {Object} new editor state
 * @description update highlight data associated to given style.
 */
export function updateHighlightData(editorState, styleName, nextData) {
    const highlightsState = getHighlightsState(editorState);

    if (highlightsState.highlightsData[styleName] === undefined) {
        throw new Error('Highlight doesn\'t exist.');
    }

    const newHighlightsState = {
        ...highlightsState,
        highlightsData: {
            ...highlightsState.highlightsData,
            [styleName]: nextData
        }
    };

    return setHighlightsState(editorState, newHighlightsState);
}

/**
 * @ngdoc method
 * @name removeHighlight
 * @param {Object} editorState
 * @param {String} styleName
 * @return {Object} new editor state
 * @description for current selection remove the highlight style and associated data.
 */
export function removeHighlight(editorState, styleName) {
    const highlightsState = getHighlightsState(editorState);

    if (highlightsState.highlightsData[styleName] === undefined) {
        return;
    }

    let nextHighlightsStyleMap = {...highlightsState.highlightsStyleMap};

    delete nextHighlightsStyleMap[styleName];

    let nextHighlightsData = {...highlightsState.highlightsData};

    delete nextHighlightsData[styleName];

    const newHighlightsState = {
        lastHighlightIds: highlightsState.lastHighlightIds,
        highlightsStyleMap: nextHighlightsStyleMap,
        highlightsData: nextHighlightsData
    };

    const newEditorState = clearInlineStyles(
        editorState,
        getDraftSelectionForEntireContent(editorState),
        [styleName]
    );

    return setHighlightsState(newEditorState, newHighlightsState);
}

export function hadHighlightsChanged(prevEditorState, nextEditorState) {
    return getHighlightsState(prevEditorState) !== getHighlightsState(nextEditorState);
}

/**
 * @ngdoc method
 * @name deleteHighlight
 * @param {Object} editorState
 * @param {String} style
 * @return {Object editorstate
 * @description For current position reset the highlight style. If it was the last
 * character with given style, delete the associated data too.
 */
export function resetHighlightForCurrentCharacter(editorState, style) {
    const type = getHighlightType(style);
    const selection = editorState.getSelection();
    const styleBefore = getHighlightStyleAtOffset(editorState, [type], selection, -1);
    const styleAfter = getHighlightStyleAtOffset(editorState, [type], selection, 1);

    if (styleBefore !== style && styleAfter !== style) {
        return removeHighlight(editorState, style);
    }

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
    const {block, newOffset} = getBlockAndOffset(editorState, selection, offset);

    if (block == null) {
        return null;
    }

    return block.getText()[newOffset];
}

/**
 * @ngdoc method
 * @name changeEditorSelection
 * @param {Object} editorState
 * @param {Integer} startOffset - the anchor offset relative to current start offset
 * @param {Integer} endOffset - the focus offset relative to current end offset
 * @param {Boolean} force - apply accept or force selection
 * @return {Object} returns new state
 * @description Change the current editor selection.
 */
export function changeEditorSelection(editorState, startOffset, endOffset, force) {
    const selection = editorState.getSelection();
    const {block: startBlock, newOffset: newStartOffset} = getBlockAndOffset(
        editorState, selection, startOffset, false);
    const {block: endBlock, newOffset: newEndOffset} = getBlockAndOffset(
        editorState, selection, endOffset, true);

    if (startBlock == null || endBlock == null) {
        return editorState;
    }

    let newSelection = selection.merge({
        anchorOffset: newStartOffset,
        anchorKey: startBlock.getKey(),
        focusOffset: newEndOffset,
        focusKey: endBlock.getKey(),
        isBackward: false
    });

    if (force) {
        return EditorState.forceSelection(editorState, newSelection);
    }

    return EditorState.acceptSelection(editorState, newSelection);
}

/**
 * @ngdoc method
 * @name getBlockAndOffset
 * @param {Object} editorState
 * @param {Object} selection
 * @param {Integer} offset
 * @param {Boolean} startFromEnd
 * @return {Object} return block and offset at new position
 * @description find the block and offset for the new position specified by offset starting
 * from beggining of selection if startFromEnd is false or from end of selection otherwise.
 */
export const getBlockAndOffset = (
    editorState,
    selection,
    offset,
    startFromEnd = false,
    limitedToSingleBlock = false
) => {
    const noValue = {block: null, newOffset: null};
    const content = editorState.getCurrentContent();
    let newOffset;
    let block;

    if (startFromEnd) {
        newOffset = selection.getEndOffset() + offset;
        block = content.getBlockForKey(selection.getEndKey());
    } else {
        newOffset = selection.getStartOffset() + offset;
        block = content.getBlockForKey(selection.getStartKey());
    }

    if (block == null) {
        return noValue;
    }

    if (limitedToSingleBlock === true) {
        const offsetWithinBlock = startFromEnd === true
            ? Math.min(newOffset, block.getLength())
            : Math.max(newOffset, 0);

        return {block: block, newOffset: offsetWithinBlock};
    }

    while (newOffset < 0) {
        block = content.getBlockBefore(block.getKey());
        if (block == null) {
            return noValue;
        }
        newOffset = block.getLength() + newOffset;
    }

    while (newOffset > block.getLength()) {
        newOffset = newOffset - block.getLength();
        block = content.getBlockAfter(block.getKey());
        if (block == null) {
            return noValue;
        }
    }

    return {block, newOffset};
};

function getLeftRangeAndTextForStyle(editorState, style) {
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    let startBlock = content.getBlockForKey(selection.getStartKey());
    let startOffset = selection.getStartOffset();
    let startText = '';
    let block = startBlock;
    let offset = startOffset < block.getLength() ? startOffset : block.getLength() - 1;
    let characterMetadataList;
    let characterMetadata;
    let blockText;
    let found;
    let newBlock = false;

    while (block) {
        found = false;
        offset = (offset == null) ? (block.getLength() - 1) : offset;
        characterMetadataList = block.getCharacterList();
        blockText = block.getText();

        for (let i = offset; i >= 0; i--) {
            characterMetadata = characterMetadataList.get(i);

            if (!characterMetadata.hasStyle(style)) {
                continue;
            }

            if (newBlock) {
                startText = ' \\ ' + startText;
                newBlock = false;
            }

            startText = blockText[i] + startText;
            startOffset = i;
            startBlock = block;
            found = true;
        }

        if (found) {
            block = content.getBlockBefore(block.getKey());
            offset = null;
            newBlock = true;
        } else {
            block = null;
        }
    }

    return {startOffset, startBlock, startText};
}

function getRightRangeAndTextForStyle(editorState, style) {
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    let endText = '';
    let endBlock = content.getBlockForKey(selection.getStartKey());
    let endOffset = selection.getStartOffset() + 1;
    let block = endBlock;
    let offset = endOffset;
    let characterMetadataList;
    let characterMetadata;
    let blockText;
    let found;
    let newBlock = false;

    if (block.getLength() === offset && offset !== 0) {
        block = content.getBlockAfter(block.getKey());

        if (block == null) {
            return {endOffset, endBlock, endText};
        }

        offset = null;
        newBlock = true;
    }

    while (block) {
        found = false;
        offset = offset == null ? 0 : offset;
        characterMetadataList = block.getCharacterList();
        blockText = block.getText();

        for (let i = offset; i < block.getLength(); i++) {
            characterMetadata = characterMetadataList.get(i);

            if (!characterMetadata.hasStyle(style)) {
                continue;
            }

            if (newBlock) {
                endText = endText + ' \\ ';
                newBlock = false;
            }

            endText = endText + blockText[i];
            endOffset = i + 1;
            endBlock = block;
            found = true;
        }

        if (found) {
            block = content.getBlockAfter(block.getKey());
            offset = null;
            newBlock = true;
        } else {
            block = null;
        }
    }

    return {endOffset, endBlock, endText};
}

/**
 * @ngdoc method
 * @name getRangeAndTextForStyle
 * @param {Object} editorState
 * @param {String} style
 * @return {Object} return a selection and text that are associated to given highlight style.
 */
export function getRangeAndTextForStyle(editorState, style) {
    const selection = editorState.getSelection();

    if (selection.isCollapsed() === false) {
        throw new Error('Only collapsed selection supported');
    }

    const {startOffset, startBlock, startText} = getLeftRangeAndTextForStyle(editorState, style);
    const {endOffset, endBlock, endText} = getRightRangeAndTextForStyle(editorState, style);
    const newSelection = selection.merge({
        anchorOffset: startOffset,
        anchorKey: startBlock.getKey(),
        focusOffset: endOffset,
        focusKey: endBlock.getKey(),
        isBackward: false
    });

    return {
        selection: newSelection,
        highlightedText: startText + endText
    };
}

/**
 * @ngdoc method
 * @name isPeerHighlight
 * @param {Object} editorState
 * @param {String} style
 * @param {String} type
 * @param {String} author
 * @return {Object} return true if the current suggestion is a complementary to type
 * (one is ADD_SUGGESTION and one is DELETE_SUGGESTION) and they have the same author
 */
function isPeerHighlight(editorState, style, type, author) {
    return style != null && getHighlightType(style) !== type
        && getHighlightAuthor(editorState, style) === author;
}

/**
 * @ngdoc method
 * @name getSuggestionData
 * @param {Object} editorState
 * @param {String} style
 * @return {Object} return the data associated with a suggestion; for replace suggestion returns
 * both old text and the suggested text and the selection returned wrap both texts.
 */
export function getSuggestionData(editorState, styleName) {
    const type = getHighlightType(styleName);
    const {selection, highlightedText} = getRangeAndTextForStyle(editorState, styleName);
    let data = {
        ...getHighlightData(editorState, styleName),
        suggestionText: highlightedText,
        selection: selection,
        styleName: styleName
    };

    if (changeSuggestionsTypes.indexOf(type) === -1) {
        return data;
    }

    let peerStyleName = getHighlightStyleAtOffset(editorState, changeSuggestionsTypes, selection, 0, true);
    let afterPeer = true;

    if (!isPeerHighlight(editorState, peerStyleName, type, data.author)) {
        peerStyleName = getHighlightStyleAtOffset(editorState, changeSuggestionsTypes, selection, -1, false);
        if (!isPeerHighlight(editorState, peerStyleName, type, data.author)) {
            return data;
        }
        afterPeer = false;
    }

    const peerRangeAndText = getRangeAndTextForStyle(editorState, peerStyleName);
    const suggestionSelection = selection.merge({
        anchorOffset: afterPeer ? selection.getStartOffset() : peerRangeAndText.selection.getStartOffset(),
        anchorKey: afterPeer ? selection.getStartKey() : peerRangeAndText.selection.getStartKey(),
        focusOffset: afterPeer ? peerRangeAndText.selection.getEndOffset() : selection.getEndOffset(),
        focusKey: afterPeer ? peerRangeAndText.selection.getEndKey() : selection.getEndKey(),
        isBackward: false
    });

    if (type === 'ADD_SUGGESTION') {
        return {
            ...data,
            type: 'REPLACE_SUGGESTION',
            oldText: peerRangeAndText.highlightedText,
            selection: suggestionSelection,
        };
    }

    return {
        ...data,
        type: 'REPLACE_SUGGESTION',
        suggestionText: peerRangeAndText.highlightedText,
        oldText: data.suggestionText,
        selection: suggestionSelection
    };
}

export function fieldHasUnresolvedSuggestions(editorState) {
    const highlights = getHighlightsState(editorState);

    if (!highlights.highlightsData) {
        return false;
    }

    return Object.keys(highlights.highlightsData || {})
        .filter((key) => suggestionsTypes.find((suggestionType) => key.indexOf(suggestionType) === 0))
        .length > 0;
}

/**
 * @ngdoc method
 * @name addCommentsForServer
 * @param {EditorState} editorState
 * @return {EditorState}
 */
function addCommentsForServer(editorState) {
    const multipleHighlights = getCustomDataFromEditor(editorState, editor3DataKeys.MULTIPLE_HIGHLIGHTS);

    if (multipleHighlights === undefined || multipleHighlights['highlightsData'] === undefined) {
        return editorState;
    }

    const highlightsData = multipleHighlights['highlightsData'];

    const comments = Object.keys(highlightsData)
        .filter((key) => key.indexOf(highlightsConfig.COMMENT.type) === 0)
        .map((key) => highlightsData[key].data);

    return setCustomDataForEditor(editorState, editor3DataKeys.__PUBLIC_API__comments, comments);
}

/**
 * @ngdoc method
 * @name handleBeforeInputHighlights
 * @description prevents inheriting of highlight styles
 */
export function handleBeforeInputHighlights(onChange, chars, editorState) {
    const selection = editorState.getSelection();

    const {block: blockLeft, newOffset: newOffsetLeft} = getBlockAndOffset(editorState, selection, -1);
    const {block: blockRight, newOffset: newOffsetRight} = getBlockAndOffset(editorState, selection, 1);

    const highlightsOnLeftExist = blockLeft != null
        && blockLeft.getInlineStyleAt(newOffsetLeft).find(styleNameBelongsToHighlight) != null;

    const highlightsOnRightExist = blockRight != null
        && blockRight.getInlineStyleAt(newOffsetRight).find(styleNameBelongsToHighlight) != null;

    if (highlightsOnLeftExist && highlightsOnRightExist) {
        return 'not-handled';
    }

    let block = null;
    let newOffset = null;

    if (blockLeft != null) {
        block = blockLeft;
        newOffset = newOffsetLeft;
    } else if (blockRight != null) {
        block = blockRight;
        newOffset = newOffsetRight;
    } else {
        return 'not-handled';
    }

    const characterStyles = block.getInlineStyleAt(newOffset);
    const stylesExcludingOwnedByHighlights = characterStyles.filter((styleName) =>
        styleNameBelongsToHighlight(styleName) === false
    );

    if (characterStyles.size === stylesExcludingOwnedByHighlights.size) {
        return 'not-handled';
    }

    const nextContentstate = Modifier.replaceText(
        editorState.getCurrentContent(),
        editorState.getSelection(),
        chars,
        stylesExcludingOwnedByHighlights
    );
    const nextEditorState = EditorState.push(editorState, nextContentstate, 'insert-characters');

    onChange(nextEditorState);

    return 'handled';
}

/**
 * @ngdoc method
 * @name applyHighlightsStyleMap
 * @param {EditorState} editorState
 * @return {EditorState}
 * @description highlightsStyleMap is not stored on the server and needs to be generated
 * If it were stored, changing highights' styles wouldn't be possible for already existing highlights
 */
function applyHighlightsStyleMap(editorState) {
    const highlights = getCustomDataFromEditor(editorState, editor3DataKeys.MULTIPLE_HIGHLIGHTS);

    if (highlights === undefined || highlights.highlightsData === undefined) {
        return editorState;
    }

    const highlightsWithStyleMapApplied = {
        ...highlights,
        highlightsStyleMap: Object.keys(highlights.highlightsData).reduce((obj, styleName) => {
            obj[styleName] = availableHighlights[getHighlightType(styleName)];
            return obj;
        }, {})
    };

    return setCustomDataForEditor(
        editorState,
        editor3DataKeys.MULTIPLE_HIGHLIGHTS,
        highlightsWithStyleMapApplied
    );
}

export const initializeHighlights = applyHighlightsStyleMap;

/**
 * @ngdoc method
 * @name removeHighlightsStyleMap
 * @param {EditorState} editorState
 * @return {EditorState}
 * @description highlightsStyleMap needs to be removed, since it's generated data
 * and not removing it, might lead to old styles being used
 */
function removeHighlightsStyleMap(editorState) {
    const highlights = getCustomDataFromEditor(editorState, editor3DataKeys.MULTIPLE_HIGHLIGHTS);
    const nextHighlights = {...highlights};

    delete nextHighlights['highlightsStyleMap'];

    return setCustomDataForEditor(
        editorState,
        editor3DataKeys.MULTIPLE_HIGHLIGHTS,
        nextHighlights
    );
}

export const prepareHighlightsForExport = (editorState) => addCommentsForServer(removeHighlightsStyleMap(editorState));

