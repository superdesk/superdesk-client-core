import {RawDraftContentState} from 'draft-js';
import {IEditorStore} from '../store';
import {CustomEditor3Entity} from '../constants';
import {getTableWithSingleCell} from '../helpers/table';
import {addTable} from './table';

export const customBlockReducer = (state: IEditorStore = {} as IEditorStore, action) => {
    switch (action.type) {
    case 'TOOLBAR_ADD_CUSTOM_BLOCK': {
        const initialContent: RawDraftContentState = action.payload.initialContent;

        return addTable(state, getTableWithSingleCell(state.editorState, initialContent), CustomEditor3Entity.CUSTOM_BLOCK);
    }
    default:
        return state;
    }
};
