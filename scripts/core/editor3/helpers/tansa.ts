import {EditorState, Modifier} from 'draft-js';
import DiffMatchPatch from 'diff-match-patch';

/**
 * Create a custom html for Tansa
 *
 * @param {EditorState} editorState
 * @returns {String}
 */
export function getTansaHtml(editorState) {
    const content = editorState.getCurrentContent();
    const blockMap = content.getBlockMap();

    return blockMap.reduce((tansaHtml, block) => {
        let html = '';

        if (block.getType() === 'atomic' && block.getEntityAt(0) != null) {
            const entityKey = block.getEntityAt(0);
            const entity = content.getEntity(entityKey);
            const data = (entity != null && entity.getData() != null) ? entity.getData() : {media: {}};
            const {media} = data;

            if (media.description_text != null) {
                html += getBlockHtml('description', block.getKey(), media.description_text);
            }

            if (media.alt_text != null) {
                html += getBlockHtml('alt', block.getKey(), media.alt_text);
            }

            if (media.headline != null) {
                html += getBlockHtml('headline', block.getKey(), media.headline);
            }
        } else {
            html = getBlockHtml('text', block.getKey(), block.getText());
        }

        return tansaHtml + html;
    }, '');
}

/**
 * Update the editor with the changes performed by Tansa
 *
 * @param {EditorState} editorState
 * @param {String} html
 * @returns {EditorState}
 */
export function setTansaHtml(editorState, html) {
    let content = editorState.getCurrentContent();
    const blockMap = content.getBlockMap();
    const htmlElement = document.createElement('div');
    const diffMatchPatch = new DiffMatchPatch();

    htmlElement.innerHTML = html;

    blockMap.forEach((block) => {
        const key = block.getKey();

        if (block.getType() === 'atomic') {
            const newDescription = getTextFromTag(htmlElement, 'description', key);
            const newAlt = getTextFromTag(htmlElement, 'alt', key);
            const newHeadline = getTextFromTag(htmlElement, 'headline', key);

            content = updateMedia(content, block, newDescription, newAlt, newHeadline);
        } else {
            const newText = getTextFromTag(htmlElement, 'text', key);

            content = updateText(editorState, content, block, newText, diffMatchPatch);
        }
    });

    return EditorState.push(editorState, content, 'insert-characters');
}

/**
 * Find the tag and extract the text
 *
 * @param {HtmlDom} htmlElement
 * @param {String} field
 * @param {String} key
 * @returns {String}
 */
function getTextFromTag(htmlElement, field, key) {
    const tagElement = htmlElement.querySelector('#' + getHtmlId(field, key));

    return tagElement != null ? tagElement.innerHTML : null;
}

/**
 * Generate an id for html tag
 *
 * @param {String} field
 * @param {String} key
 * @returns {String}
 */
function getHtmlId(field, key) {
    return field + '-' + key;
}

/**
 * Generate the tag
 *
 * @param {String} field
 * @param {String} key
 * @param {String} text
 * @returns {String}
 */
function getBlockHtml(field, key, text) {
    return `<p id="${getHtmlId(field, key)}">${text}</p>\n`;
}

/**
 * Update the description of the media block
 *
 * @param {ContentState} contentState
 * @param {Block} block
 * @param {String} text
 * @returns {ContentState}
 */
function updateMedia(content, block, newDescription, newAlt, newHeadline) {
    const entityKey = block.getEntityAt(0);
    const entity = content.getEntity(entityKey);
    const data = (entity != null && entity.getData() != null) ? entity.getData() : null;
    let newContent = content;

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

        newContent = content.mergeEntityData(entityKey, data);
    }

    return newContent;
}

/**
 * Update the text in the block and preserve the existing inline styles and entities
 *
 * @param {EditorState} editorState
 * @param {ContentState} contentState
 * @param {Block} block
 * @param {String} text
 * @returns {ContentState}
 */
function updateText(editorState, content, block, newText, diffMatchPatch) {
    const text = block.getText();
    let newContent = content;
    let offset = 0;
    let diffs;
    let previousDiff;

    diffs = diffMatchPatch.diff_main(text, newText);

    diffs.forEach((diff) => {
        const _text = diff[1];

        if (diff[0] === 0) {
            if (previousDiff != null) {
                const _previousText  = previousDiff[1];

                newContent = removeText(editorState, newContent, block, offset, _previousText);
            }
            offset += _text.length;
            previousDiff = null;
        } else if (diff[0] === 1) {
            if (previousDiff == null) {
                ({newContent, offset} = insertText(editorState, newContent, block, offset, _text));
            } else {
                const _previousText  = previousDiff[1];

                ({newContent, offset}  =  replaceText(editorState, newContent, block, offset, _previousText, _text));
                previousDiff = null;
            }
        } else {
            if (previousDiff != null) {
                const _previousText  = previousDiff[1];

                newContent = removeText(editorState, newContent, block, offset, _previousText);
            }

            previousDiff = diff;
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
function insertText(editorState, content, block, offset, text) {
    const selection = createSelectionForBlock(editorState, block, offset);
    const newContent = Modifier.insertText(content, selection, text);

    offset += text.length;
    return {newContent, offset};
}

/**
 * Replate text with newText and preserve the existing inline styles and entities
 *
 * @param {EditorState} editorState
 * @param {ContentState} content
 * @param {Block} block
 * @param {Integer} offset
 * @param {String} text
 * @param {String} newText
 * @returns {ContentState, Integer}
 */
function replaceText(editorState, content, block, offset, text, newText)  {
    const overlapLength = text.length < newText.length ? text.length : newText.length;
    let newContent = content;

    for (let i = 0; i < overlapLength; i++) {
        const inlineStyle = block.getInlineStyleAt(offset + i);
        const entity = block.getEntityAt(offset + i);
        const selection = createSelectionForBlock(editorState, block, offset + i, 1);
        const newCharacter = newText[i];

        newContent = Modifier.replaceText(newContent, selection, newCharacter, inlineStyle, entity);
    }

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
        offset += extraText.length;
    }

    return {newContent, offset};
}

/**
 * Remove the 'text' at offset position
 *
 * @param {EditorState} editorState
 * @param {ContentState} content
 * @param {Block} block
 * @param {Integer} offset
 * @param {String} text
 * @returns {ContentState}
 */
function removeText(editorState, content, block, offset, text) {
    const selection = createSelectionForBlock(editorState, block, offset, text.length);
    const newContent = Modifier.removeRange(content, selection, 'forward');

    return newContent;
}

/**
 * Create a selection in block at the offset
 *
 * @param {EditorState} editorState
 * @param {Block} block
 * @returns {SelectionState}
 */
function createSelectionForBlock(editorState, block, offset, size = 0) {
    const selection = editorState.getSelection();

    return selection.merge({
        anchorKey: block.getKey(),
        anchorOffset: offset,
        focusKey: block.getKey(),
        focusOffset: offset + size,
        isBackward: false,
    });
}
