// Types
import {
    IWorkspaceActionTypes,
    IWorkspaceState,
    WORKSPACE_SET_CURRENT_DESK_ID,
    WORKSPACE_SET_FILTER_PANEL_STATE,
    WORKSPACE_SET_DESK_SAMS_SETTINGS,
    WORKSPACE_SET_SINGLE_DESK_SAMS_SETTINGS,
} from './types';

const initialState: IWorkspaceState = {
    filterPanelOpen: false,
    currentDeskId: null,
    deskSamsSettings: {},
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
    case WORKSPACE_SET_CURRENT_DESK_ID:
        return {
            ...state,
            currentDeskId: action.payload,
        };
    case WORKSPACE_SET_DESK_SAMS_SETTINGS:
        return {
            ...state,
            deskSamsSettings: action.payload,
        };
    case WORKSPACE_SET_SINGLE_DESK_SAMS_SETTINGS:
        return {
            ...state,
            deskSamsSettings: {
                ...state.deskSamsSettings,
                [action.payload.id]: action.payload.settings,
            },
        };
    default:
        return state;
    }
}
