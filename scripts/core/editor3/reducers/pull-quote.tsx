import {ContentState, convertToRaw} from 'draft-js';
import insertAtomicBlockWithoutEmptyLines from '../helpers/insertAtomicBlockWithoutEmptyLines';
import {getBlockKeys} from '../helpers/selection/blockKeys';
import {IEditorStore} from '../store';
import {onChange} from './editor3';

/**
 * @description Contains the list of multi-line quote related reducers.
 */
const pullQuote = (state: IEditorStore | any = {}, action) => {
    switch (action.type) {
    case 'TOOLBAR_ADD_MULTI-LINE_QUOTE':
        return addPullQuote(state, action.payload);
    case 'TOGGLE_PULL_MULTI-LINE_TOOLBAR':
        return togglePullQuoteToolbar(state);
    default:
        return state;
    }
};

const addPullQuote = (state: IEditorStore, data) => {
    const contentState = state.editorState.getCurrentContent();
    const selectionState = state.editorState.getSelection();
    let contentStateWithEntity: ContentState;

    if (!selectionState.isCollapsed()) {
        // Get user selected content and insert it into the newly created MULTI-LINE_QUOTE block
        const selectedBlocks = getBlockKeys(contentState, selectionState.getStartKey(), selectionState.getEndKey())
            .map((key) => contentState.getBlockForKey(key));
        const cells = {0: {0: convertToRaw(ContentState.createFromBlockArray(selectedBlocks))}};

        contentStateWithEntity = contentState.createEntity('MULTI-LINE_QUOTE', 'MUTABLE', {data: {...data, cells: cells}});
    } else {
        contentStateWithEntity = contentState.createEntity('MULTI-LINE_QUOTE', 'MUTABLE', {data});
    }

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const {editorState} = insertAtomicBlockWithoutEmptyLines(
        state.editorState,
        entityKey,
        ' ',
    );

    return onChange(state, editorState);
};

const togglePullQuoteToolbar = (state: IEditorStore) => {
    return {
        ...state,
        toolbarStyle: 'pullQuote',
    };
};

export default pullQuote;
