import {IEditorStore} from '../store';
import {CustomEditor3Entity} from '../constants';
import {getTableWithSingleCell} from '../helpers/table';
import {addTable} from './table';

export function multiLineQuoteReducer(state: IEditorStore | any = {}, action) {
    switch (action.type) {
    case 'TOOLBAR_ADD_MULTI-LINE_QUOTE':
        return addTable(
            state,
            {
                entityKind: CustomEditor3Entity.MULTI_LINE_QUOTE,
                entityData: getTableWithSingleCell(state.editorState, 'editor-selection'),
            },
        );
    default:
        return state;
    }
}
