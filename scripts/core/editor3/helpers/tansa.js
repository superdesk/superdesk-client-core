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
 * Update the text in the block
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
    let selection;

    diffs = diffMatchPatch.diff_main(text, newText);

    diffs.forEach((diff) => {
        const text = diff[1];

        if (diff[0] === 0) {
            offset += text.length;
        } else if (diff[0] === 1) {
            selection = createSelectionForBlock(editorState, block, offset);
            offset += text.length;

            newContent = Modifier.insertText(newContent, selection, text);
        } else {
            selection = createSelectionForBlock(editorState, block, offset, text.length);

            newContent = Modifier.removeRange(newContent, selection, 'forward');
        }
    });

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