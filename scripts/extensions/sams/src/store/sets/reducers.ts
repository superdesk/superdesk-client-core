// Types
import {CONTENT_PANEL_STATE, ISetItem} from '../../interfaces';
import {
    ISetActionTypes,
    ISetState,
    RECEIVE_SETS,
    UPDATE_SET_IN_STORE,
    REMOVE_SET_IN_STORE,
    MANAGE_SETS_EDIT,
    MANAGE_SETS_PREVIEW,
    MANAGE_SETS_CLOSE_CONTENT_PANEL,
    MANAGE_SETS_DELETE_CONFIRMATION_OPEN,
    MANAGE_SETS_ON_CLOSED,
} from './types';

const initialState: ISetState = {
    sets: [],
    contentPanelState: CONTENT_PANEL_STATE.CLOSED,
    selectedSetId: undefined,
    deleteConfirmationOpen: false,
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
    case UPDATE_SET_IN_STORE:
        return updateSetInStore(state, action.payload);
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
    case MANAGE_SETS_DELETE_CONFIRMATION_OPEN:
        return {
            ...state,
            deleteConfirmationOpen: action.payload,
        };
    case MANAGE_SETS_ON_CLOSED:
        return {
            ...initialState,
            sets: state.sets,
        };
    default:
        return state;
    }
}

function updateSetInStore(prevState: ISetState, updatedSet: ISetItem) {
    const state: ISetState = Object.assign({}, prevState);

    state.sets = state.sets.map(
        (set: ISetItem) => {
            return set._id === updatedSet._id ?
                updatedSet :
                set;
        },
    );

    return state;
}

function removeSetFromStore(prevState: ISetState, setToDelete: ISetItem) {
    return {
        ...prevState,
        sets: prevState.sets.filter(
            (set: ISetItem) => set._id !== setToDelete._id,
        ),
    };
}
