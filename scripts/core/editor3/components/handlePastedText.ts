/* eslint-disable max-depth */

import {EditorState, ContentState, Modifier, genKey, CharacterMetadata, ContentBlock, DraftHandleValue} from 'draft-js';
import {List, OrderedMap} from 'immutable';
import {getContentStateFromHtml} from '../html/from-html';
import * as Suggestions from '../helpers/suggestions';
import {sanitizeContent, inlineStyles} from '../helpers/inlineStyles';
import {getAllCustomDataFromEditor, setAllCustomDataForEditor} from '../helpers/editor3CustomData';
import {getCurrentAuthor} from '../helpers/author';
import {htmlComesFromDraftjsEditor} from '../helpers/htmlComesFromDraftjsEditor';
import {EDITOR_GLOBAL_REFS} from 'core/editor3/components/Editor3Component';

function removeMediaFromHtml(htmlString): string {
    const element = document.createElement('div');

    element.innerHTML = htmlString;

    Array.from(element.querySelectorAll('img,audio,video')).forEach((mediaElement) => {
        mediaElement.remove();
    });

    return element.innerHTML;
}

function pasteContentFromOpenEditor(
    html: string,
    editorState: EditorState,
    editorKey: string,
    onChange: (e: EditorState) => void,
    editorFormat: Array<string>,
): DraftHandleValue {
    if (html.includes(editorKey)) { // comes from the same editor
        return 'not-handled';
    }

    for (const key in window[EDITOR_GLOBAL_REFS]) {
        if (html.includes(key)) {
            const editor = window[EDITOR_GLOBAL_REFS][key];

            if (editor) {
                const internalClipboard = editor.getClipboard();

                if (internalClipboard) {
                    const blocksArray = [];

                    internalClipboard.forEach((b) => blocksArray.push(b));
                    const contentState = ContentState.createFromBlockArray(blocksArray);

                    const editorWithContent = insertContentInState(editorState, contentState, editorFormat);

                    return 'handled';
                }
            }
        }
    }

    return 'not-handled';
}

/**
 * @ngdoc method
 * @name handlePastedText
 * @param {string} text Text content of paste.
 * @param {string=} _html HTML content of paste.
 * @returns {Boolean} True if this method took paste into its own hands.
 * @description Handles pasting into the editor, in cases where the content contains
 * atomic blocks that need special handling in editor3.
 */
export function handlePastedText(text: string, _html: string): DraftHandleValue {
    const author = getCurrentAuthor();
    let html = _html;

    if (typeof html === 'string') {
        html = removeMediaFromHtml(html);
    }

    const {editorState, suggestingMode, onPasteFromSuggestingMode, onChange, editorFormat} = this.props;

    if (!html && !text) {
        return 'handled';
    }

    if (suggestingMode) {
        if (!Suggestions.allowEditSuggestionOnLeft(editorState, author)
            && !Suggestions.allowEditSuggestionOnRight(editorState, author)) {
            return 'handled';
        }

        const content = html ? getContentStateFromHtml(html) : ContentState.createFromText(text);

        onPasteFromSuggestingMode(content);
        return 'handled';
    }

    if (html &&
        pasteContentFromOpenEditor(html, editorState, this.editorKey, onChange, editorFormat) === 'handled') {
        return 'handled';
    }

    if (htmlComesFromDraftjsEditor(html)) {
        return 'not-handled';
    }

    return processPastedHtml(html || text, editorState, onChange, editorFormat);
}

export function insertContentInState(
    editorState: EditorState,
    pastedContent: ContentState,
    editorFormat: Array<string>): EditorState {
    let _pastedContent = pastedContent;
    const blockMap = _pastedContent.getBlockMap();
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

    _pastedContent = sanitizeContent(EditorState.createWithContent(_pastedContent), acceptedInlineStyles)
        .getCurrentContent();

    blockMap.forEach((block) => {
        if (!hasAtomicBlocks || block.getType() !== 'atomic') {
            return blocks.push(block);
        }

        const entityKey = block.getEntityAt(0);
        const entity = _pastedContent.getEntity(entityKey);

        contentState = contentState.addEntity(entity);

        blocks = blocks.concat(
            atomicBlock(block.getData(), contentState.getLastCreatedEntityKey()),
        );
    });

    if (hasAtomicBlocks) {
        contentState = Modifier.setBlockType(contentState, selection, 'atomic');

        blocks = blocks.concat(emptyBlock()); // add empty block to ensure writting afterwards
    }

    const newBlockMap = OrderedMap<string, ContentBlock>(blocks.map((b) => ([b.getKey(), b])));

    // const selectionAfterInsert = nextEditorState.getSelection();
    const customData = getAllCustomDataFromEditor(editorState);

    // for the first block recover the initial block data because on replaceWithFragment the block data is
    // replaced with the data from pasted fragment
    const editorStateWithCustomData = setAllCustomDataForEditor(editorState, customData);
    const newContent = Modifier.replaceWithFragment(editorStateWithCustomData.getCurrentContent(), editorState.getSelection(), newBlockMap);
    const nextEditorState = EditorState.push(editorStateWithCustomData, newContent, 'insert-fragment');

    return nextEditorState;
}

// Checks if there are atomic blocks in the paste content. If there are, we need to set
// the 'atomic' block type using the Modifier tool and add these entities to the
// contentState.
function processPastedHtml(
    html: string,
    editorState: EditorState,
    onChange: (e: EditorState) => void,
    editorFormat: Array<string>): DraftHandleValue {
    const pastedContent = getContentStateFromHtml(html);

    const editorWithPastedText = insertContentInState(
        editorState,
        pastedContent,
        editorFormat,
    );

    onChange(editorWithPastedText);

    return 'handled';
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
