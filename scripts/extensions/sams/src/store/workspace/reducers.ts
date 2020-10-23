// Types
import {
    IWorkspaceActionTypes,
    IWorkspaceState,
    WORKSPACE_SET_FILTER_PANEL_STATE,
} from './types';

const initialState: IWorkspaceState = {
    filterPanelOpen: false,
};

export function workspaceReducer(
    state: IWorkspaceState = initialState,
    action: IWorkspaceActionTypes,
): IWorkspaceState {
    switch (action.type) {
    case WORKSPACE_SET_FILTER_PANEL_STATE:
        return {
            ...state,
            filterPanelOpen: action.payload,
        };
    default:
        return state;
    }
}
