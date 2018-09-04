import {EditorState, ContentState, Modifier, genKey, CharacterMetadata, ContentBlock} from 'draft-js';
import {List, OrderedMap} from 'immutable';
import {getContentStateFromHtml} from '../html/from-html';
import * as Suggestions from '../helpers/suggestions';
import {sanitizeContent, inlineStyles} from '../helpers/inlineStyles';
import {getAllCustomDataFromEditor, setAllCustomDataForEditor} from '../helpers/editor3CustomData';
import {getCurrentAuthor} from '../helpers/author';
import {htmlComesFromDraftjsEditor} from '../helpers/htmlComesFromDraftjsEditor';
import {EDITOR_GLOBAL_REFS} from 'core/editor3/components/Editor3Component';

enum DraftHandleValue {
    HANDLED = 'handled',
    NOT_HANDLED = 'not-handled',
}

function removeMediaFromHtml(htmlString) : string {
    const element = document.createElement('div');

    element.innerHTML = htmlString;

    Array.from(element.querySelectorAll('img,audio,video')).forEach((mediaElement) => {
        mediaElement.remove();
    });

    return element.innerHTML;
}

function pasteContentFromOpenEditor(props: any, html: string) : DraftHandleValue {
    for (const editorKey in window[EDITOR_GLOBAL_REFS]) {
        if (html.includes(editorKey)) {
            const editor = window[EDITOR_GLOBAL_REFS][editorKey];
            const internalClipboard = editor.getClipboard();

            if (internalClipboard) {
                const blocksArray = [];

                internalClipboard.map((b) => blocksArray.push(b));
                const contentState = ContentState.createFromBlockArray(blocksArray);

                return insertContentInState(props, contentState);
            }
        }
    }

    return DraftHandleValue.NOT_HANDLED;
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
export function handlePastedText(text: string, _html: string) : DraftHandleValue {
    const author = getCurrentAuthor();
    let html = _html;

    if (typeof html === 'string') {
        html = removeMediaFromHtml(html);
    }

    const {editorState, suggestingMode, onPasteFromSuggestingMode} = this.props;

    if (!html && !text) {
        return DraftHandleValue.HANDLED;
    }

    if (suggestingMode) {
        if (!Suggestions.allowEditSuggestionOnLeft(editorState, author)
            && !Suggestions.allowEditSuggestionOnRight(editorState, author)) {
            return DraftHandleValue.HANDLED;
        }

        const content = html ? getContentStateFromHtml(html) : ContentState.createFromText(text);

        onPasteFromSuggestingMode(content);
        return DraftHandleValue.HANDLED;
    }

    if (pasteContentFromOpenEditor(this.props, html) === DraftHandleValue.HANDLED) {
        return DraftHandleValue.HANDLED;
    }


    if (htmlComesFromDraftjsEditor(html)) {
        return DraftHandleValue.NOT_HANDLED;
    }

    return processPastedHtml(this.props, html || text);
}

function insertContentInState(props: any, _pastedContent: ContentState) : DraftHandleValue {
    const {editorState, editorFormat, onChange} = props;
    let pastedContent = _pastedContent;
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

    const newBlockMap = OrderedMap<string, ContentBlock>(blocks.map((b) => ([b.getKey(), b])));

    let nextEditorState = EditorState.push(
        editorState,
        Modifier.replaceWithFragment(contentState, selection, newBlockMap),
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

    return DraftHandleValue.HANDLED;
}

// Checks if there are atomic blocks in the paste content. If there are, we need to set
// the 'atomic' block type using the Modifier tool and add these entities to the
// contentState.
function processPastedHtml(props: any, html: string) : DraftHandleValue {
    let pastedContent = getContentStateFromHtml(html);

    return insertContentInState(props, pastedContent);
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
