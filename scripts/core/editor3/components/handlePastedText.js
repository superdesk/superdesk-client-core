import {EditorState, ContentState, Modifier, genKey, CharacterMetadata, ContentBlock} from 'draft-js';
import {List, OrderedSet} from 'immutable';
import {getContentStateFromHtml} from '../html/from-html';
import * as Suggestions from '../helpers/suggestions';
import {sanitizeContent, inlineStyles} from '../helpers/inlineStyles';
import {getAllCustomDataFromEditor, setAllCustomDataForEditor} from '../helpers/editor3CustomData';
import {getCurrentAuthor} from '../helpers/author';
import {htmlComesFromDraftjsEditor} from '../helpers/htmlComesFromDraftjsEditor';

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
 * @param {string} text Text content of paste.
 * @param {string=} _html HTML content of paste.
 * @returns {Boolean} True if this method took paste into its own hands.
 * @description Handles pasting into the editor, in cases where the content contains
 * atomic blocks that need special handling in editor3.
 */
export function handlePastedText(text, _html) {
    const author = getCurrentAuthor();
    let html = _html;

    if (typeof html === 'string') {
        html = removeMediaFromHtml(html);
    }

    const {editorState, suggestingMode, onPasteFromSuggestingMode} = this.props;

    if (!html && !text) {
        return HANDLED;
    }

    if (suggestingMode) {
        if (!Suggestions.allowEditSuggestionOnLeft(editorState, author)
            && !Suggestions.allowEditSuggestionOnRight(editorState, author)) {
            return HANDLED;
        }

        const content = html ? getContentStateFromHtml(html) : ContentState.createFromText(text);

        onPasteFromSuggestingMode(content);
        return HANDLED;
    }

    if (htmlComesFromDraftjsEditor(html)) {
        return NOT_HANDLED;
    }

    return processPastedHtml(this.props, html || text);
}

// Checks if there are atomic blocks in the paste content. If there are, we need to set
// the 'atomic' block type using the Modifier tool and add these entities to the
// contentState.
function processPastedHtml(props, html) {
    const {onChange, editorState, editorFormat} = props;
    let pastedContent = getContentStateFromHtml(html);
    const blockMap = pastedContent.getBlockMap();
    const hasAtomicBlocks = blockMap.some((block) => block.getType() === 'atomic');
    const acceptedInlineStyles =
        Object.keys(inlineStyles)
            .filter((style) => editorFormat.includes(style))
            .map((style) => inlineStyles[style]);

    let contentState = editorState.getCurrentContent();
    let selection = editorState.getSelection();
    let blocks = [];

    if (hasAtomicBlocks) {
        contentState = Modifier.splitBlock(editorState.getCurrentContent(), editorState.getSelection());
        selection = contentState.getSelectionAfter();
    }

    pastedContent = sanitizeContent(EditorState.createWithContent(pastedContent), acceptedInlineStyles)
        .getCurrentContent();

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
    const customData = getAllCustomDataFromEditor(editorState);

    // for the first block recover the initial block data because on replaceWithFragment the block data is
    // replaced with the data from pasted fragment
    nextEditorState = setAllCustomDataForEditor(nextEditorState, customData);

    // reset undo stack
    nextEditorState = EditorState.push(
        editorState,
        nextEditorState.getCurrentContent(),
        'insert-fragment'
    );

    nextEditorState = EditorState.forceSelection(nextEditorState, selectionAfterInsert);

    onChange(nextEditorState);

    return HANDLED;
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
