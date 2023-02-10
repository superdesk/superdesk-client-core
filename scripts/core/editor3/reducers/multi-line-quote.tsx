import insertAtomicBlockWithoutEmptyLines from '../helpers/insertAtomicBlockWithoutEmptyLines';
import {ContentState, convertToRaw, RawDraftContentState} from 'draft-js';
import {getBlockKeys} from '../helpers/selection/blockKeys';
import {IEditorStore} from '../store';
import {onChange} from './editor3';

/**
 * Contains the list of multi-line quote related reducers.
 */
const multiLineQuote = (state: IEditorStore | any = {}, action) => {
    switch (action.type) {
    case 'TOOLBAR_ADD_MULTI-LINE_QUOTE':
        return addMultiLineQuote(state);
    default:
        return state;
    }
};

/**
 * Multi-line quote reuses the table component so data has to be
 * compatible with table's data structure.
 */
const getTableData = (cells?: RawDraftContentState) => {
    const data = {
        data: {
            cells: [],
            numRows: 1,
            numCols: 1,
            withHeader: false,
        },
    };

    if (cells != null) {
        return {
            data: {
                ...data.data,
                cells: {0: {0: cells}},
            },
        };
    } else {
        return data;
    }
};

const addMultiLineQuote = (state: IEditorStore) => {
    const contentState = state.editorState.getCurrentContent();
    const selectionState = state.editorState.getSelection();
    let contentStateWithEntity: ContentState;

    if (!selectionState.isCollapsed()) {
        // Get user selected content and insert it into the newly created MULTI-LINE_QUOTE block
        const selectedBlocks = getBlockKeys(contentState, selectionState.getStartKey(), selectionState.getEndKey())
            .map((key) => contentState.getBlockForKey(key));

        contentStateWithEntity = contentState.createEntity('MULTI-LINE_QUOTE', 'MUTABLE',
            getTableData(convertToRaw(ContentState.createFromBlockArray(selectedBlocks))),
        );
    } else {
        contentStateWithEntity = contentState.createEntity('MULTI-LINE_QUOTE', 'MUTABLE', getTableData());
    }

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const {editorState} = insertAtomicBlockWithoutEmptyLines(
        state.editorState,
        entityKey,
        ' ',
    );

    return onChange(state, editorState);
};

export default multiLineQuote;
