import {EditorState, SelectionState} from 'draft-js';

function removeContentBlock(editorState, contentBlockKey) {
    var contentState = editorState.getCurrentContent();
    var blockMap = contentState.getBlockMap();
    var newBlockMap = blockMap.remove(contentBlockKey);
    var newContentState = contentState.merge({
        blockMap: newBlockMap
    });
    var newEditorState = EditorState.push(editorState, newContentState, 'remove-range');

    return newEditorState;
}

function getContentBlockKeyToSelect(editorState) {
    var currentSelectionAnchorKey = editorState.getSelection().getAnchorKey();

    var blocks = editorState.getCurrentContent().getBlocksAsArray();

    for (var i = 0; i < blocks.length; i++) {
        if (blocks[i].getKey() === currentSelectionAnchorKey) {
            return blocks[i - 1].getKey();
        }
    }
}

function getContentBlockKeysToRemove(editorState) {
    var blockKeysToRemove = [];

    var blocks = editorState.getCurrentContent().getBlocksAsArray();

    blocks.forEach((block, i) => {
        if (block.getType() !== 'atomic') {
            return;
        }

        var previousBlock = i > 0 ? blocks[i - 1] : null;

        if (previousBlock !== null && previousBlock.getType() === 'unstyled' && previousBlock.getLength() === 0) {
            blockKeysToRemove.push(previousBlock.getKey());
        }

        var nextBlock = i < blocks.length - 1 ? blocks[i + 1] : null;

        if (nextBlock !== null && nextBlock.getType() === 'unstyled' && nextBlock.getLength() === 0) {
            blockKeysToRemove.push(nextBlock.getKey());
        }
    });

    return blockKeysToRemove;
}

export default function(editorState) {
    var editorStateNext = editorState;

    var blockKeysToRemove = getContentBlockKeysToRemove(editorStateNext);
    var blockKeyToSelect = getContentBlockKeyToSelect(editorStateNext);

    blockKeysToRemove.forEach((key) => {
        editorStateNext = removeContentBlock(editorStateNext, key);
    });

    editorStateNext = EditorState.forceSelection(editorStateNext, SelectionState.createEmpty(blockKeyToSelect));

    return editorStateNext;
}