import {ContentState, convertToRaw} from 'draft-js';
import insertAtomicBlockWithoutEmptyLines from '../helpers/insertAtomicBlockWithoutEmptyLines';
import {IEditorStore} from '../store';
import {onChange} from './editor3';

/**
 * @description Contains the list of pull quote related reducers.
 */
const pullQuote = (state: IEditorStore | any = {}, action) => {
    switch (action.type) {
    case 'TOOLBAR_ADD_PULL_QUOTE':
        return addPullQuote(state, action.payload);
    case 'TOGGLE_PULL_QUOTE_TOOLBAR':
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
        // Get user selected content and insert it into the newly created PULL_QUOTE block
        const start = selectionState.getStartKey();
        const end = selectionState.getEndKey();

        // TODO: Deprecate scripts/core/editor3/helpers/selection/blockKeys.ts and make a new version
        const selectedBlocks = contentState
            .getBlockMap()
            .keySeq()
            .skipUntil((k) => k === start)
            .takeUntil((k) => k === end)
            .concat(end)
            .toArray()
            .map((key) => contentState.getBlockForKey(key));
        const cells = {0: {0: convertToRaw(ContentState.createFromBlockArray(selectedBlocks))}};

        contentStateWithEntity = contentState.createEntity('PULL_QUOTE', 'MUTABLE', {data: {...data, cells: cells}});
    } else {
        contentStateWithEntity = contentState.createEntity('PULL_QUOTE', 'MUTABLE', {data});
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
