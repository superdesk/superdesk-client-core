import {ContentBlock, ContentState, Editor, EditorState, Modifier, SelectionState} from 'draft-js';
import DiffMatchPatch from 'diff-match-patch';

/**
 * Create custom html which includes DraftJS block IDs that will be used later to
 * patch html on top of editor state.
 */
export function prepareHtmlForPatching(editorState: EditorState): string {
    const content = editorState.getCurrentContent();
    const blockMap = content.getBlockMap();

    return blockMap.map((block) => {
        let html = '';

        if (block.getType() === 'atomic' && block.getEntityAt(0) != null) {
            const entityKey = block.getEntityAt(0);
            const entity = content.getEntity(entityKey);
            const data = (entity != null && entity.getData() != null) ? entity.getData() : {media: {}};
            const {media} = data;

            if (media != null) {
                if (media.description_text != null) {
                    html += getBlockHtml('description', block.getKey(), media.description_text);
                }

                if (media.alt_text != null) {
                    html += getBlockHtml('alt', block.getKey(), media.alt_text);
                }

                if (media.headline != null) {
                    html += getBlockHtml('headline', block.getKey(), media.headline);
                }
            }
        } else {
            html = getBlockHtml('text', block.getKey(), block.getText());
        }

        return html;
    }).join('\n');
}

/**
 * Update the editor with html changes
 * If simpleReplace is true try to preserve the existing inline styles and entities
 */
export function patchHTMLonTopOfEditorState(
    editorState: EditorState,
    preparedHtml: string,
    simpleReplace?: boolean,
): EditorState {
    let content = editorState.getCurrentContent();
    const blockMap = content.getBlockMap();
    const htmlElement = document.createElement('div');
    const diffMatchPatch = new DiffMatchPatch();

    htmlElement.innerHTML = preparedHtml;

    blockMap.forEach((block) => {
        const key = block.getKey();

        if (block.getType() === 'atomic') {
            const newDescription = getTextFromTag(htmlElement, 'description', key);
            const newAlt = getTextFromTag(htmlElement, 'alt', key);
            const newHeadline = getTextFromTag(htmlElement, 'headline', key);

            content = updateMedia(content, block, newDescription, newAlt, newHeadline);
        } else {
            const newText = getTextFromTag(htmlElement, 'text', key);

            content = updateText(editorState, content, block, newText, diffMatchPatch, simpleReplace);
        }
    });

    return EditorState.push(editorState, content, 'insert-characters');
}

/**
 * Find the tag and extract the text
 */
function getTextFromTag(htmlElement: HTMLDivElement, field: string, key: string) {
    const tagElement: HTMLElement = htmlElement.querySelector('#' + getHtmlId(field, key));

    return tagElement != null ? stripHtml(tagElement.innerText) : null;
}

/**
 * Generate an id for html tag
 */
function getHtmlId(field: string, key: string): string {
    return field + '-' + key;
}

/**
 * Generate the tag
 */
function getBlockHtml(field: string, key: string, text: string): string {
    const p = document.createElement('p');

    p.id = getHtmlId(field, key);
    p.innerText = encode(text);

    return p.outerHTML;
}

/**
 * Update the description of the media block
 */
function updateMedia(
    contentState: ContentState,
    block: ContentBlock,
    newDescription: string,
    newAlt: string,
    newHeadline: string,
): ContentState {
    const entityKey = block.getEntityAt(0);
    const entity = contentState.getEntity(entityKey);
    const data = (entity != null && entity.getData() != null) ? entity.getData() : null;
    let newContent = contentState;

    if (data != null) {
        if (newDescription) {
            data.media.description_text = newDescription;
        }

        if (newAlt) {
            data.media.alt_text = newAlt;
        }

        if (newHeadline) {
            data.media.headline = newHeadline;
        }

        newContent = contentState.mergeEntityData(entityKey, data);
    }

    return newContent;
}

/**
 * Update the text in the block
 * If the simpleReplace is true try to preserve the existing inline styles and entities
 */
function updateText(
    editorState: EditorState,
    contentState: ContentState,
    block: ContentBlock,
    newText: string,
    diffMatchPatch,
    simpleReplace: boolean,
) {
    const text = block.getText();
    let newContent = contentState;
    let offset = 0;
    let diffs;
    let previousDiff;

    diffs = diffMatchPatch.diff_main(text, newText);

    diffs.forEach((diff) => {
        const _text = diff[1];

        if (diff[0] === 0) {
            if (previousDiff != null) {
                const _previousText = previousDiff[1];

                newContent = removeText(editorState, newContent, block, offset, _previousText);
            }
            offset += _text.length;
            previousDiff = null;
        } else if (diff[0] === 1) {
            if (previousDiff == null) {
                ({newContent, offset} = insertText(editorState, newContent, block, offset, _text));
            } else {
                const _previousText = previousDiff[1];

                ({newContent, offset} = replaceText(editorState, newContent, block, offset, _previousText, _text));
                previousDiff = null;
            }
        } else {
            if (previousDiff != null) {
                const _previousText = previousDiff[1];

                newContent = removeText(editorState, newContent, block, offset, _previousText);
            }

            if (simpleReplace === true) {
                newContent = removeText(editorState, newContent, block, offset, _text);
            } else {
                previousDiff = diff;
            }
        }
    });

    return newContent;
}

/**
 * Insert a new text at offset position
 *
 * @param {EditorState} editorState
 * @param {ContentState} content
 * @param {Block} block
 * @param {Integer} offset
 * @param {String} text
 * @returns {ContentState, Integer}
 */
function insertText(
    editorState: EditorState,
    content: ContentState,
    block: ContentBlock,
    offset: number,
    text: string,
): {newContent: ContentState, offset: number} {
    const selection = createSelectionForBlock(editorState, block, offset);
    const newContent = Modifier.insertText(content, selection, text);

    // eslint-disable-next-line
    offset += text.length;
    return {newContent, offset};
}

/**
 * Replace text with newText and preserve the existing inline styles and entities
 */
function replaceText(
    editorState: EditorState,
    content: ContentState,
    block: ContentBlock,
    offset: number,
    text: string,
    newText: string,
): {newContent: ContentState, offset: number} {
    const overlapLength = text.length < newText.length ? text.length : newText.length;
    let newContent = content;

    for (let i = 0; i < overlapLength; i++) {
        const inlineStyle = block.getInlineStyleAt(offset + i);
        const entity = block.getEntityAt(offset + i);
        const selection = createSelectionForBlock(editorState, block, offset + i, 1);
        const newCharacter = newText[i];

        newContent = Modifier.replaceText(newContent, selection, newCharacter, inlineStyle, entity);
    }

    // eslint-disable-next-line no-param-reassign
    offset += overlapLength;

    if (overlapLength < text.length) {
        const extraText = text.substring(overlapLength);

        newContent = removeText(editorState, newContent, block, offset, extraText);
    }

    if (overlapLength < newText.length) {
        const lastInlineStyle = block.getInlineStyleAt(overlapLength - 1);
        const lastEntity = block.getEntityAt(overlapLength - 1);
        const extraText = newText.substring(overlapLength);
        const selection = createSelectionForBlock(editorState, block, offset, extraText.length);

        newContent = Modifier.insertText(newContent, selection, extraText, lastInlineStyle, lastEntity);
        // eslint-disable-next-line no-param-reassign
        offset += extraText.length;
    }

    return {newContent, offset};
}

/**
 * Remove the 'text' at offset position
 */
function removeText(
    editorState: EditorState,
    contentState: ContentState,
    block: ContentBlock,
    offset: number,
    text: string,
): ContentState {
    const selection = createSelectionForBlock(editorState, block, offset, text.length);
    const newContent = Modifier.removeRange(contentState, selection, 'forward');

    return newContent;
}

/**
 * Create a selection in block at the offset
 */
function createSelectionForBlock(
    editorState: EditorState,
    block: ContentBlock,
    offset: number,
    size = 0,
): SelectionState {
    const selection = editorState.getSelection();

    return selection.merge({
        anchorKey: block.getKey(),
        anchorOffset: offset,
        focusKey: block.getKey(),
        focusOffset: offset + size,
        isBackward: false,
    });
}

/**
 * Tansa uses text from selected element for proofing
 * but then it parses entities in it so those must be
 * escaped. Also used in macros.
 */
function encode(text: string): string {
    const div = document.createElement('div');

    div.innerText = text;

    return div.innerHTML;
}

function stripHtml(htmlString: string): string {
    const div = document.createElement('div');

    div.innerHTML = htmlString;

    return div.innerText;
}
