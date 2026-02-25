/* eslint-disable max-depth */

import {EditorState, ContentState, Modifier, genKey, CharacterMetadata, ContentBlock, DraftHandleValue} from 'draft-js';
import {List, OrderedMap} from 'immutable';
import {getContentStateFromHtml} from '../html/from-html';
import * as Suggestions from '../helpers/suggestions';
import {sanitizeContent, inlineStyles} from '../helpers/inlineStyles';
import {getAllCustomDataFromEditor, setAllCustomDataForEditor} from '../helpers/editor3CustomData';
import {getCurrentAuthor} from '../helpers/author';
import {htmlComesFromDraftjsEditor} from '../helpers/htmlComesFromDraftjsEditor';
import {EDITOR_GLOBAL_REFS, EDITOR_COPY_METADATA} from 'core/editor3/components/Editor3Component';
import {escape as escapeHtml} from 'lodash';
import {hashString} from '../helpers/hashString';

function removeMediaFromHtml(htmlString): string {
    const element = document.createElement('div');

    element.innerHTML = htmlString;

    Array.from(element.querySelectorAll('img,audio,video')).forEach((mediaElement) => {
        mediaElement.remove();
    });

    return element.innerHTML;
}

/**
 * Returns true when the current clipboard text was copied from an editor in this
 * window. Checks both the content hash (guards against stale metadata from a
 * previous copy) and that the source editor is still mounted in EDITOR_GLOBAL_REFS.
 */
export function isCopySourceInThisWindow(text: string): boolean {
    const copyMetadata = window[EDITOR_COPY_METADATA];

    return copyMetadata != null
        && copyMetadata.contentHash === hashString(text)
        && window[EDITOR_GLOBAL_REFS]?.[copyMetadata.editorKey] != null;
}

/**
 * Handles paste when the source is another Editor3 instance in the same window.
 *
 * Uses the window-scoped EDITOR_COPY_METADATA variable set by Editor3Component's
 * native copy listener to identify the source editor. The content hash is checked
 * first to ensure the clipboard was not replaced after the copy event fired.
 *
 * When the source editor is confirmed, its DraftJS internal clipboard is used
 * directly, which preserves all inline styles (custom tags, subscript, superscript,
 * etc.) that would otherwise survive only partially through an HTML round-trip.
 *
 * Returns 'not-handled' for cross-window pastes (source editor not in this
 * window's EDITOR_GLOBAL_REFS).
 */
export function pasteContentFromOpenEditor(
    text: string,
    editorState: EditorState,
    editorKey: string,
    onChange: (e: EditorState) => void,
    editorFormat: Array<string>,
): DraftHandleValue {
    const copyMetadata = window[EDITOR_COPY_METADATA];

    if (copyMetadata == null) {
        return 'not-handled';
    }

    const currentHash = hashString(text);

    if (copyMetadata.contentHash !== currentHash) {
        return 'not-handled';
    }

    const sourceEditorKey = copyMetadata.editorKey;

    if (sourceEditorKey === editorKey) {
        return 'not-handled';
    }

    const editor = window[EDITOR_GLOBAL_REFS]?.[sourceEditorKey];

    if (editor == null) {
        return 'not-handled';
    }

    const internalClipboard = editor.getClipboard();

    if (internalClipboard == null) {
        return 'not-handled';
    }

    const blocksArray = [];

    internalClipboard.forEach((b) => blocksArray.push(b));

    const contentState = ContentState.createFromBlockArray(blocksArray);
    const editorWithContent = insertContentInState(editorState, contentState, editorFormat);

    onChange(editorWithContent);

    return 'handled';
}

// preserve line breaks when pasting or forcing plain text
// \r are important for draft convertFromHTML to preserve initial spaces on each line
export const createHtmlFromText = (text: string): string =>
    escapeHtml(text).split('\n').map((line) => `<p>${line}</p>`).join('');

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

    if (text != null && (this.props.cleanPastedHtml || html == null)) {
        html = createHtmlFromText(text);
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
        pasteContentFromOpenEditor(text, editorState, this.editorKey, onChange, editorFormat) === 'handled') {
        return 'handled';
    }

    // Defer to DraftJS only when the source editor is in this window so it can then
    // use its internal clipboard, preserving all inline styles. For cross-window paste
    // we fall through to processPastedHtml. EDITOR_COPY_METADATA is used instead of
    // html.includes(editorKey) because Chrome omits data-editor from clipboard HTML.
    if (htmlComesFromDraftjsEditor(html, false) && isCopySourceInThisWindow(text)) {
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
    const customData = getAllCustomDataFromEditor(editorState);

    const newContent = Modifier.replaceWithFragment(
        editorState.getCurrentContent(),
        editorState.getSelection(),
        newBlockMap,
    );

    let nextEditorState = EditorState.push(editorState, newContent, 'insert-fragment');

    // for the first block recover the initial block data because on replaceWithFragment the block data is
    // replaced with the data from pasted fragment
    nextEditorState = setAllCustomDataForEditor(nextEditorState, customData);

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
