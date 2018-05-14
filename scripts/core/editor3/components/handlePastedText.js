import {EditorState, ContentState, Modifier, genKey, CharacterMetadata, ContentBlock} from 'draft-js';
import {List, OrderedSet} from 'immutable';
import {fromHTML} from 'core/editor3/html';
import * as Suggestions from '../helpers/suggestions';
import {sanitizeContent, inlineStyles} from '../helpers/inlineStyles';
import {getAllCustomDataFromEditor, setAllCustomDataForEditor} from '../helpers/editor3CustomData';

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
 * @param {string=} _html HTML content of paste.
 * @returns {Boolean} True if this method took paste into its own hands.
 * @description Handles pasting into the editor, in cases where the content contains
 * atomic blocks that need special handling in editor3.
 */
export function handlePastedText(editorKey, text, _html) {
    let html = _html;

    if (typeof html === 'string') {
        html = removeMediaFromHtml(html);
    }

    const {editorState, suggestingMode, onPasteFromSuggestingMode} = this.props;

    if (!html && !text) {
        return HANDLED;
    }

    if (suggestingMode) {
        if (!Suggestions.allowEditSuggestionOnLeft(editorState)
            && !Suggestions.allowEditSuggestionOnRight(editorState)) {
            return HANDLED;
        }

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
        return processPastedHtml(this.props, html);
    }

    return NOT_HANDLED;
}

// Checks if there are atomic blocks in the paste content. If there are, we need to set
// the 'atomic' block type using the Modifier tool and add these entities to the
// contentState.
function processPastedHtml(props, html) {
    const {onChange, editorState, editorFormat} = props;
    const pastedContent = fromHTML(html);
    const blockMap = pastedContent.getBlockMap();
    const hasAtomicBlocks = blockMap.some((block) => block.getType() === 'atomic');
    const acceptedInlineStyles =
        Object.keys(inlineStyles)
            .filter((style) => editorFormat.includes(style))
            .map((style) => inlineStyles[style]);

    const customData = getAllCustomDataFromEditor(editorState);
    let contentState = editorState.getCurrentContent();
    let selection = editorState.getSelection();
    let blocks = [];

    if (hasAtomicBlocks) {
        contentState = Modifier.splitBlock(editorState.getCurrentContent(), editorState.getSelection());
        selection = contentState.getSelectionAfter();
    }

    blockMap.forEach((block) => {
        if (!hasAtomicBlocks || block.getType() !== 'atomic') {
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

    if (hasAtomicBlocks) {
        contentState = Modifier.setBlockType(contentState, selection, 'atomic');
    }

    let nextEditorState = EditorState.push(
        editorState,
        Modifier.replaceWithFragment(contentState, selection, OrderedSet(blocks)),
        'insert-fragment'
    );

    const selectionAfterInsert = nextEditorState.getSelection();

    nextEditorState = EditorState.set(nextEditorState, {allowUndo: false});

    nextEditorState = sanitizeContent(nextEditorState, acceptedInlineStyles);

    nextEditorState = EditorState.forceSelection(
        nextEditorState,
        selectionAfterInsert
    );

    nextEditorState = EditorState.set(nextEditorState, {allowUndo: true});

    // for the first block recover the initial block data because on replaceWithFragment the block data is
    // replaced with the data from pasted fragment
    nextEditorState = setAllCustomDataForEditor(nextEditorState, customData);

    onChange(nextEditorState);

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
