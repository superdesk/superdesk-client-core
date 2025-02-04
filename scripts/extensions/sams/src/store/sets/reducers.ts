// Types
import {CONTENT_PANEL_STATE, ISetItem} from '../../interfaces';
import {
    ISetActionTypes,
    ISetState,
    MANAGE_SETS_CLOSE_CONTENT_PANEL,
    MANAGE_SETS_EDIT,
    MANAGE_SETS_PREVIEW,
    MANAGE_SETS_RESET,
    RECEIVE_SETS,
    REMOVE_SET_IN_STORE,
    RECEIVE_ASSETS_COUNT,
} from './types';

const initialState: ISetState = {
    sets: [],
    contentPanelState: CONTENT_PANEL_STATE.CLOSED,
    selectedSetId: undefined,
    counts: {},
};

export function setsReducer(
    state: ISetState = initialState,
    action: ISetActionTypes,
): ISetState {
    switch (action.type) {
    case RECEIVE_SETS:
        return {
            ...state,
            sets: action.payload,
        };
    case REMOVE_SET_IN_STORE:
        return removeSetFromStore(state, action.payload);
    case MANAGE_SETS_EDIT:
        return {
            ...state,
            contentPanelState: CONTENT_PANEL_STATE.EDIT,
            selectedSetId: action.payload,
        };
    case MANAGE_SETS_PREVIEW:
        return {
            ...state,
            contentPanelState: CONTENT_PANEL_STATE.PREVIEW,
            selectedSetId: action.payload,
        };
    case MANAGE_SETS_CLOSE_CONTENT_PANEL:
        return {
            ...state,
            contentPanelState: CONTENT_PANEL_STATE.CLOSED,
            selectedSetId: undefined,
        };
    case MANAGE_SETS_RESET:
        return {
            ...state,
            contentPanelState: CONTENT_PANEL_STATE.CLOSED,
            selectedSetId: undefined,
        };
    case RECEIVE_ASSETS_COUNT:
        return {
            ...state,
            counts: action.payload,
        };
    default:
        return state;
    }
}

function removeSetFromStore(prevState: ISetState, setToDelete: ISetItem) {
    return {
        ...prevState,
        sets: prevState.sets.filter(
            (set: ISetItem) => set._id !== setToDelete._id,
        ),
    };
}
