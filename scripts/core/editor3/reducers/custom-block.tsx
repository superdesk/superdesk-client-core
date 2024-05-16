import {RawDraftContentState} from 'draft-js';
import {IEditorStore} from '../store';
import {CustomEditor3Entity} from '../constants';
import {getTableWithSingleCell} from '../helpers/table';
import {addTable} from './table';

export const customBlockReducer = (state: IEditorStore = {} as IEditorStore, action) => {
    switch (action.type) {
    case 'TOOLBAR_ADD_CUSTOM_BLOCK': {
        const initialContent: RawDraftContentState = action.payload.initialContent;

        return addTable(
            state,
            {
                entityKind: CustomEditor3Entity.CUSTOM_BLOCK,
                entityData: {
                    ...getTableWithSingleCell(state.editorState, initialContent),
                    vocabularyId: action.payload.vocabularyId,
                },
            },
        );
    }
    default:
        return state;
    }
};
