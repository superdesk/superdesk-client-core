import {EditorState, ContentState, Modifier, genKey, CharacterMetadata, ContentBlock} from 'draft-js';
import {List, OrderedSet} from 'immutable';
import {fromHTML} from 'core/editor3/html';
import * as Highlights from '../helpers/highlights';
import {initSelectionIterator, hasNextSelection} from '../helpers/selectionIterator';
import {suggestionsTypes} from '../highlightsConfig';
import ng from 'core/services/ng';

function removeMediaFromHtml(htmlString) {
    const element = document.createElement('div');

    element.innerHTML = htmlString;

    Array.from(element.querySelectorAll('img,audio,video')).forEach((mediaElement) => {
        mediaElement.remove();
    });

    return element.innerHTML;
}

const HANDLED = 'handled';
const NOT_HANDLED = 'not-handled';

/**
 * @ngdoc method
 * @name handlePastedText
 * @param {string} editorKey
 * @param {string} text Text content of paste.
 * @param {string=} html HTML content of paste.
 * @returns {Boolean} True if this method took paste into its own hands.
 * @description Handles pasting into the editor, in cases where the content contains
 * atomic blocks that need special handling in editor3.
 */
export function handlePastedText(editorKey, text, _html) {
    var html = _html;

    if (typeof html === 'string') {
        html = removeMediaFromHtml(html);
    }

    const {suggestingMode, onPasteFromSuggestingMode} = this.props;

    if (!this.allowEditSuggestion('insert')) {
        return HANDLED;
    }

    if (!html && !text) {
        return HANDLED;
    }

    if (suggestingMode) {
        const content = html ? fromHTML(html) : ContentState.createFromText(text);

        onPasteFromSuggestingMode(content);
        return HANDLED;
    }

    // If there are blocks that have been copied from the host editor, let the editor
    // handle the paste. The chance of having content both from the editor and from
    // outside it as a mix in the clipboard is impossible.
    if (HTMLComesFromEditor(html, editorKey)) {
        return NOT_HANDLED;
    }

    if (html) {
        return ensureAtomicBlocks(this.props, html);
    }

    return NOT_HANDLED;
}

// Checks if there are atomic blocks in the paste content. If there are, we need to set
// the 'atomic' block type using the Modifier tool and add these entities to the
// contentState.
function ensureAtomicBlocks(props, html) {
    const {onChange, editorState} = props;
    const pastedContent = fromHTML(html);
    const blockMap = pastedContent.getBlockMap();
    const hasAtomicBlocks = blockMap.some((block) => block.getType() === 'atomic');

    if (!hasAtomicBlocks) {
        return NOT_HANDLED;
    }

    let contentState = Modifier.splitBlock(editorState.getCurrentContent(), editorState.getSelection());
    let selection = contentState.getSelectionAfter();
    let blocks = [];

    blockMap.forEach((block) => {
        if (block.getType() !== 'atomic') {
            return blocks.push(block);
        }

        const entityKey = block.getEntityAt(0);
        const entity = pastedContent.getEntity(entityKey);

        contentState = contentState.addEntity(entity);

        blocks = blocks.concat(
            atomicBlock(block.getData(), contentState.getLastCreatedEntityKey()),
            emptyBlock()
        );
    });

    contentState = Modifier.setBlockType(contentState, selection, 'atomic');
    contentState = Modifier.replaceWithFragment(contentState, selection, OrderedSet(blocks));

    onChange(EditorState.push(editorState, contentState, 'insert-characters'));

    return HANDLED;
}

// Checks if the given html contains blocks coming from the editor with
function HTMLComesFromEditor(html, editorKey) {
    const tree = $('<div></div>');

    tree.html(html);

    return $(tree).find(`[data-block="true"][data-editor="${editorKey}"]`).length > 0;
}

// Returns an empty block.
const emptyBlock = () => new ContentBlock({
    key: genKey(), type: 'unstyled', text: '', characterList: List(),
});

// Returns an atomic block with the given data, linked to the given entity key.
const atomicBlock = (data, entity) => new ContentBlock({
    key: genKey(), type: 'atomic', text: ' ',
    characterList: List([CharacterMetadata.create({entity})]),
    data: data,
});

/**
 * @ngdoc method
 * @name allowEditSuggestion
 * @param {string} operation - one of insert, backspace or delete
 * @returns {Boolean} True if the current text don't contains a noneditable suggestion.
 * @description Check if the current text don't contain a noneditable suggestion.
 */
export function allowEditSuggestion(action) {
    const {suggestingMode, editorState} = this.props;
    const selection = editorState.getSelection();
    let newEditorState;
    let tmpEditorState;

    if (!selection.isCollapsed()) {
        newEditorState = initSelectionIterator(editorState);
        while (hasNextSelection(newEditorState, selection)) {
            const data = Highlights.getHighlightDataAtCurrentPosition(
                newEditorState, suggestionsTypes);

            if (!allowEditForData(data, suggestingMode)) {
                return false;
            }

            tmpEditorState = Highlights.changeEditorSelection(newEditorState, 1, 1, false);
            if (tmpEditorState === newEditorState) {
                break;
            }
            newEditorState = tmpEditorState;
        }

        return true;
    }

    const dataBefore = Highlights.getHighlightDataAtOffset(editorState, suggestionsTypes, selection, -1);
    const dataAfter = Highlights.getHighlightDataAtOffset(editorState, suggestionsTypes, selection, 0);
    const allowEditBefore = allowEditForData(dataBefore, suggestingMode);
    const editBefore = allowEditBefore && (action === 'backspace' || action === 'insert');
    const allowEditAfter = allowEditForData(dataAfter, suggestingMode);
    const editAfter = allowEditAfter && (action === 'delete' || action === 'insert');
    const editBetweenSuggestions = dataBefore !== dataAfter && action === 'insert';

    return editBefore || editAfter || editBetweenSuggestions;
}

// Check if the current allow the edit.
const allowEditForData = (data, suggestingMode) => {
    if (data == null) {
        return true;
    }

    const user = ng.get('session').identity._id;
    const author = data.author;

    return suggestingMode && author === user;
};
