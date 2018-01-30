import {
    BlockMapBuilder,
    CharacterMetadata,
    ContentBlock,
    Modifier,
    EditorState,
    genKey
} from 'draft-js';

const Immutable = require('immutable');

var List = Immutable.List,
    Repeat = Immutable.Repeat;

function getInsertionTarget(contentState, selectionState) {

    var afterRemoval = Modifier.removeRange(contentState, selectionState, 'backward');
    var targetSelection = afterRemoval.getSelectionAfter();
    var afterSplit = Modifier.splitBlock(afterRemoval, targetSelection);

    // return unsplit content if after the splitting first line is empty
    if (afterSplit.getBlockForKey(afterSplit.getSelectionBefore().getAnchorKey()).getText().length < 1) {
        return {
            contentState: afterRemoval,
            selectionState: targetSelection
        };
    }

    var insertionTarget = afterSplit.getSelectionAfter();

    return {
        contentState: afterSplit,
        selectionState: insertionTarget
    };
}

/*
    insertAtomicBlockWithoutEmptyLinesAroundIt: function(
        editorState: EditorState,
        entityKey: string,
        character: string
    ): EditorState
*/

function insertAtomicBlockWithoutEmptyLinesAroundIt(editorState, entityKey, character) {
    var selectionState = editorState.getSelection();
    var target = getInsertionTarget(editorState.getCurrentContent(), selectionState);
    var asAtomicBlock = Modifier.setBlockType(target.contentState, target.selectionState, 'atomic');
    var charData = CharacterMetadata.create({entity: entityKey});
    var fragmentArray = [];

    if (asAtomicBlock.getFirstBlock().getKey() === target.selectionState.getAnchorKey()) {
        fragmentArray.push(new ContentBlock({
            key: genKey(),
            type: 'unstyled',
            text: '',
            characterList: List()
        }));
    }

    fragmentArray.push(new ContentBlock({
        key: genKey(),
        type: 'atomic',
        text: character,
        characterList: List(Repeat(charData, character.length))
    }));

    if (
        // check if atomic is the last block in the editor
        asAtomicBlock.getLastBlock().getKey() === target.selectionState.getAnchorKey()
        ||
        // check if cursor is not at the end of the block
        target.selectionState.getFocusOffset()
        !== target.contentState.getBlockForKey(target.selectionState.getFocusKey()).getText().length
    ) {
        fragmentArray.push(new ContentBlock({
            key: genKey(),
            type: 'unstyled',
            text: '',
            characterList: List()
        }));
    }

    var fragment = BlockMapBuilder.createFromArray(fragmentArray);

    var withAtomicBlock = Modifier.replaceWithFragment(asAtomicBlock, target.selectionState, fragment);

    var newContent = withAtomicBlock.merge({
        selectionBefore: selectionState,
        selectionAfter: withAtomicBlock.getSelectionAfter().set('hasFocus', true)
    });

    return EditorState.push(editorState, newContent, 'insert-fragment');
}

module.exports = insertAtomicBlockWithoutEmptyLinesAroundIt;