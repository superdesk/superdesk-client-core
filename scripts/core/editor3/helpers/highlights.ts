import {RichUtils, EditorState} from 'draft-js';
import {getHighlightsConfig} from '../highlightsConfig';
import {editor3DataKeys, getCustomDataFromEditor, setCustomDataForEditor__deprecated} from './editor3CustomData';
import {getDraftCharacterListForSelection} from './getDraftCharacterListForSelection';
import {getDraftSelectionForEntireContent} from './getDraftSelectionForEntireContent';
import {resizeDraftSelection} from './resizeDraftSelection';
import {clearInlineStyles} from './clearInlineStyles';
import {changeSuggestionsTypes, paragraphSuggestionTypes} from '../highlightsConfig';
import {has} from 'lodash';
import {gettext} from 'core/utils';

export const paragraphSeparator = '¶';

export function getAvailableHighlights() {
    const highlightsConfig = getHighlightsConfig();

    return Object.keys(highlightsConfig).reduce((obj, key) => {
        obj[key] = highlightsConfig[key].draftStyleMap;
        return obj;
    }, {});
}

export function getTypeByInlineStyle(inlineStyle) {
    const highlightsConfig = getHighlightsConfig();
    const mapInlineStyleToHighlightType = Object.keys(highlightsConfig).reduce((obj, key) => {
        if (highlightsConfig[key].type === 'STYLE') {
            obj[highlightsConfig[key].style] = key;
        }
        return obj;
    }, {});

    return mapInlineStyleToHighlightType[inlineStyle];
}

export function getInlineStyleByType(type) {
    const highlightsConfig = getHighlightsConfig();
    const mapHighlightTypeToInlineStyle = Object.keys(highlightsConfig).reduce((obj, key) => {
        if (highlightsConfig[key].type === 'STYLE') {
            obj[key] = highlightsConfig[key].style;
        }
        return obj;
    }, {});

    return mapHighlightTypeToInlineStyle[type];
}

export function getHighlightDescription(suggestionsType) {
    const highlight = getHighlightsConfig()[suggestionsType];

    if (highlight != null && highlight.description) {
        return highlight.description;
    }

    return suggestionsType;
}

export function getBlockStylesDescription(blockStyle) {
    const blockStylesDescription = {
        'header-one': 'H1',
        'header-two': 'H2',
        'header-three': 'H3',
        'header-four': 'H4',
        'header-five': 'H5',
        'header-six': 'H6',
        blockquote: gettext('quote'),
        'unordered-list-item': gettext('unordered list'),
        'ordered-list-item': gettext('ordered list'),
        'code-block': gettext('preformatted'),
    };

    if (blockStyle == null || !(blockStyle in blockStylesDescription)) {
        return '';
    }

    return blockStylesDescription[blockStyle];
}

function getInitialHighlightsState() {
    return {
        highlightsStyleMap: {},
        highlightsData: {},
        lastHighlightIds: Object.keys(getAvailableHighlights()).reduce((obj, key) => {
            obj[key] = 0;
            return obj;
        }, {}),
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
    return setCustomDataForEditor__deprecated(editorState, editor3DataKeys.MULTIPLE_HIGHLIGHTS, hightlightsState);
}

function getHighlightType(styleName) {
    const delimiterIndex = styleName.lastIndexOf('-');

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
    return Object.keys(getAvailableHighlights()).includes(highlightType);
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

    const delimiterIndex = styleName.lastIndexOf('-');

    if (delimiterIndex === -1) {
        return false;
    }

    return Object.keys(getAvailableHighlights()).includes(styleName.slice(0, delimiterIndex));
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

    const delimiterIndex = styleName.lastIndexOf('-');

    if (delimiterIndex === -1) {
        throw new Error('Style name does not contain a highlight type');
    }

    const highlightType = styleName.slice(0, delimiterIndex);

    if (highlightTypeValid(highlightType) === false) {
        throw new Error(`Invalid highlight type '${highlightType}'`);
    }

    return highlightType;
}

/**
 * @ngdoc method
 * @name isHighlightStyle
 * @param {String} styleName
 * @return {Boolean}
 * @description return true if styleName coresponds to a valid type.
 */
export function isHighlightStyle(styleName) {
    const delimiterIndex = styleName.lastIndexOf('-');

    if (delimiterIndex === -1) {
        return false;
    }

    return highlightTypeValid(styleName.slice(0, delimiterIndex));
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
        true,
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
 * @param {Boolean} fromEnd - if true start from end of the selection
 * @param {Boolean} firstFound - if true return first style found otherwise return all styles found
 * @description the highlight style from the new possition specified by offset.
 */
export function getHighlightStyleAtOffset(
    editorState, types, selection, offset, fromEnd = false, firstFound = true): string | Array<string> {
    const {block, newOffset} = getBlockAndOffset(editorState, selection, offset, fromEnd);

    if (block == null) {
        return null;
    }

    const inlineStyles = block.getInlineStyleAt(newOffset);
    let highlightStyle = firstFound ? null : [];

    inlineStyles.forEach((style) => {
        if (styleNameBelongsToHighlight(style)) {
            const type = getHighlightTypeFromStyleName(style);

            if (type != null && types.indexOf(type) !== -1 && type !== style) {
                if (firstFound) {
                    highlightStyle = highlightStyle || style;
                } else {
                    highlightStyle.push(style);
                }
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
 * @param {Boolean} fromEnd - if true start from end of the selection
 * @param {Boolean} firstFound - if true return first style found otherwise return all styles found
 * @return {String}
 * @description return the style of type for current character position.
 */
export function getHighlightStyleAtCurrentPosition(editorState, types, fromEnd = false, firstFound = true) {
    const selection = editorState.getSelection();

    return getHighlightStyleAtOffset(editorState, types, selection, 0, fromEnd, firstFound);
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
export function getHighlightDataAtOffset(editorState, types, selection, offset, fromEnd = false) {
    const style = getHighlightStyleAtOffset(editorState, types, selection, offset, fromEnd) as string;

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
 * Test if current selection has given type style applied
 *
 * @param {EditorState} editorState
 * @param {String} type
 * @returns {Boolean}
 */
function selectionHasType(editorState, type) {
    const characters = getDraftCharacterListForSelection(editorState, editorState.getSelection());

    return characters.every((character) => character.getStyle().some((style) => style.indexOf(type) === 0));
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
export function addHighlight(editorState, type, data, single = false) {
    let nextEditorState = editorState;

    const initialSelection = nextEditorState.getSelection().merge({
        hasFocus: true,
    });

    const highlightsState = getHighlightsState(nextEditorState);

    if (highlightTypeValid(type) !== true) {
        throw new Error('Highlight type invalid');
    }

    if (single && selectionHasType(editorState, type)) {
        return editorState;
    }

    let newIndex = 0;

    if (highlightsState.lastHighlightIds && has(highlightsState.lastHighlightIds, type)) {
        newIndex = highlightsState.lastHighlightIds[type] + 1;
    }
    const styleName = type + '-' + newIndex;

    const newHighlightsState = {
        lastHighlightIds: {
            ...highlightsState.lastHighlightIds,
            [type]: newIndex,
        },
        highlightsStyleMap: {
            ...highlightsState.highlightsStyleMap,
            [styleName]: getAvailableHighlights()[type],
        },
        highlightsData: {
            ...highlightsState.highlightsData,
            [styleName]: {
                ...data,
                type,
            },
        },
    };

    nextEditorState = RichUtils.toggleInlineStyle(nextEditorState, styleName);

    // prevent recording the changes to undo stack so user doesn't have to undo twice
    // for the highlight to be completelly(both inline styles and related data) undone
    nextEditorState = EditorState.set(nextEditorState, {allowUndo: false});

    nextEditorState = setHighlightsState(nextEditorState, newHighlightsState);

    // make sure the cursor is at the right position after undo
    // it used to always end up at the position 0 of the first block
    // when undoing after changing block data with `allowUndo` set to false
    nextEditorState = EditorState.push(
        nextEditorState,
        nextEditorState.getCurrentContent().set('selectionBefore', initialSelection),
        'change-block-data',
    );

    // restore focus lost after clicking a toolbar action or entering highlight data OR pushing editorState
    // so the selection is visible after undo
    nextEditorState = EditorState.acceptSelection(
        nextEditorState,
        initialSelection,
    );

    nextEditorState = EditorState.set(nextEditorState, {allowUndo: true});

    return nextEditorState;
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
            [styleName]: nextData,
        },
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
        return editorState;
    }

    const nextHighlightsStyleMap = {...highlightsState.highlightsStyleMap};

    delete nextHighlightsStyleMap[styleName];

    const nextHighlightsData = {...highlightsState.highlightsData};

    delete nextHighlightsData[styleName];

    const newHighlightsState = {
        lastHighlightIds: highlightsState.lastHighlightIds,
        highlightsStyleMap: nextHighlightsStyleMap,
        highlightsData: nextHighlightsData,
    };

    let newEditorState = clearInlineStyles(
        editorState,
        getDraftSelectionForEntireContent(editorState),
        [styleName],
    );

    // prevent recording the changes to undo stack so user doesn't have to undo twice
    // for the highlight deletion to be completelly(both inline styles and related data) undone
    newEditorState = EditorState.set(newEditorState, {allowUndo: false});
    newEditorState = setHighlightsState(newEditorState, newHighlightsState);
    newEditorState = EditorState.set(newEditorState, {allowUndo: true});

    return newEditorState;
}

export function hadHighlightsChanged(prevEditorState, nextEditorState) {
    return getHighlightsState(prevEditorState) !== getHighlightsState(nextEditorState);
}

/**
 * @ngdoc method
 * @name resetHighlightForCurrentSelection
 * @param {Object} editorState
 * @param {String} style
 * @return {Object} editor state
 * @description For current selection reset the highlight style. If it was the last
 * selection with given style, delete the associated data too.
 */
export function resetHighlightForCurrentSelection(editorState, style) {
    const type = getHighlightType(style);
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(selection.getStartKey());
    const offset = selection.getStartOffset() === block.getLength() - 1 ? 1 : 0;
    const styleBefore = getHighlightStyleAtOffset(editorState, [type], selection, -1);
    const styleAfter = getHighlightStyleAtOffset(editorState, [type], selection, offset, true);

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

    const newSelection = selection.merge({
        anchorOffset: newStartOffset,
        anchorKey: startBlock.getKey(),
        focusOffset: newEndOffset,
        focusKey: endBlock.getKey(),
        isBackward: false,
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
    limitedToSingleBlock = false,
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
        newOffset = block.getLength() + newOffset + 1;
    }

    while (newOffset > block.getLength()) {
        newOffset = newOffset - block.getLength() - 1;
        block = content.getBlockAfter(block.getKey());
        if (block == null) {
            return noValue;
        }
    }

    return {block, newOffset};
};

function getLeftRangeAndTextForStyle(editorState, style) {
    const type = getHighlightTypeFromStyleName(style);
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

    if (paragraphSuggestionTypes.indexOf(type) !== -1) {
        startText = block.getText()
            .substring(0, startOffset) + paragraphSeparator;

        return {startOffset, startBlock, startText};
    }

    while (block) {
        if (block.getLength() === 0) {
            block = content.getBlockBefore(block.getKey());
            continue;
        }

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
                startText = paragraphSeparator + startText;
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
    /* eslint-disable complexity */
    const type = getHighlightTypeFromStyleName(style);
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

    if (paragraphSuggestionTypes.indexOf(type) !== -1) {
        endText = block.getText()
            .substring(endOffset);

        if (endText === '') {
            block = content.getBlockAfter(block.getKey());
            endText = block.getText();
        }

        return {endOffset, endBlock, endText};
    }

    if (block.getLength() === offset && offset !== 0) {
        block = content.getBlockAfter(block.getKey());

        if (block == null) {
            return {endOffset, endBlock, endText};
        }

        offset = null;
        newBlock = true;
    }

    while (block) {
        if (block.getLength() === 0) {
            block = content.getBlockAfter(block.getKey());
            continue;
        }

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
                endText = endText + paragraphSeparator;
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
export function getRangeAndTextForStyle(editorState, style, leftOnly = false) {
    const selection = editorState.getSelection();

    if (selection.isCollapsed() === false) {
        throw new Error('Only collapsed selection supported');
    }

    const {startOffset, startBlock, startText} = getLeftRangeAndTextForStyle(editorState, style);
    const {endOffset, endBlock, endText} = getRightRangeAndTextForStyle(editorState, style);
    const newSelection = selection.merge({
        anchorOffset: startOffset,
        anchorKey: startBlock.getKey(),
        focusOffset: leftOnly ? selection.getEndOffset() : endOffset,
        focusKey: leftOnly ? selection.getEndKey() : endBlock.getKey(),
        isBackward: false,
    });

    return {
        selection: newSelection,
        highlightedText: leftOnly ? startText + endText[0] : startText + endText,
    };
}

export function getRangeAndTextForStyleInRawState(rawEditorState, highlightId) {
    let highlightedText = '';

    for (const {inlineStyleRanges, text} of rawEditorState.blocks) {
        for (const {offset, length, style} of inlineStyleRanges) {
            if (style === highlightId) {
                const textRange = text.substring(offset, offset + length);

                highlightedText = highlightedText.length > 0
                    ? highlightedText = `${highlightedText}${paragraphSeparator}${textRange}`
                    : highlightedText = textRange;
            }
        }
    }

    return {highlightedText};
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

    const data = {
        ...getHighlightData(editorState, styleName),
        suggestionText: highlightedText,
        selection: selection,
        styleName: styleName,
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

    const beforeSelection = selection.merge({
        anchorOffset: selection.getStartOffset(),
        anchorKey: selection.getStartKey(),
        focusOffset: selection.getStartOffset(),
        focusKey: selection.getStartKey(),
        isBackward: false,
    });
    const afterSelection = selection.merge({
        anchorOffset: selection.getEndOffset(),
        anchorKey: selection.getEndKey(),
        focusOffset: selection.getEndOffset(),
        focusKey: selection.getEndKey(),
        isBackward: false,
    });
    const beforeEditorState = EditorState.acceptSelection(editorState, beforeSelection);
    const afterEditorState = EditorState.acceptSelection(editorState, afterSelection);

    const peerRangeAndText = getRangeAndTextForStyle(afterPeer ? afterEditorState : beforeEditorState, peerStyleName);

    const suggestionSelection = selection.merge({
        anchorOffset: afterPeer ? selection.getStartOffset() : peerRangeAndText.selection.getStartOffset(),
        anchorKey: afterPeer ? selection.getStartKey() : peerRangeAndText.selection.getStartKey(),
        focusOffset: afterPeer ? peerRangeAndText.selection.getEndOffset() : selection.getEndOffset(),
        focusKey: afterPeer ? peerRangeAndText.selection.getEndKey() : selection.getEndKey(),
        isBackward: false,
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
        selection: suggestionSelection,
    };
}

/**
 * @ngdoc method
 * @name addCommentsForServer
 * @param {EditorState} editorState
 * @return {EditorState}
 */
function addCommentsForServer(editorState) {
    const multipleHighlights = getCustomDataFromEditor(editorState, editor3DataKeys.MULTIPLE_HIGHLIGHTS);

    if (multipleHighlights === undefined || multipleHighlights.highlightsData === undefined) {
        return editorState;
    }

    const highlightsData = multipleHighlights.highlightsData;

    const comments = Object.keys(highlightsData)
        .filter((key) => key.indexOf(getHighlightsConfig().COMMENT.type) === 0)
        .map((key) => highlightsData[key].data);

    return setCustomDataForEditor__deprecated(editorState, editor3DataKeys.__PUBLIC_API__comments, comments);
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
            obj[styleName] = getAvailableHighlights()[getHighlightType(styleName)];
            return obj;
        }, {}),
    };

    return setCustomDataForEditor__deprecated(
        editorState,
        editor3DataKeys.MULTIPLE_HIGHLIGHTS,
        highlightsWithStyleMapApplied,
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

    delete nextHighlights.highlightsStyleMap;

    return setCustomDataForEditor__deprecated(
        editorState,
        editor3DataKeys.MULTIPLE_HIGHLIGHTS,
        nextHighlights,
    );
}

export const prepareHighlightsForExport = (editorState) => addCommentsForServer(removeHighlightsStyleMap(editorState));

/**
 * Highlight current entity
 *
 * @param {EditorState} initialState
 * @param {String} type
 * @param {Object} data
 * @param {Boolean} single
 * @returns {EditorState}
 */
export function highlightEntity(initialState, type, data, single) {
    let editorState = initialState;
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(selection.getStartKey());
    const entity = block.getEntityAt(selection.getStartOffset());

    block.findEntityRanges((characterMeta) => characterMeta.getEntity() === entity,
        (start, end) => {
            editorState = EditorState.acceptSelection(editorState, selection.merge({
                isBackward: false,
                anchorOffset: start,
                focusOffset: end,
            }));
            editorState = addHighlight(editorState, type, data, single);
            editorState = EditorState.push(editorState, editorState.getCurrentContent(), 'change-block-data');
            editorState = EditorState.acceptSelection(editorState, selection);
        });
    return editorState;
}
