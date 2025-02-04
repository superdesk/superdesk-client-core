// Types
import {IDesk} from 'superdesk-api';
import {
    IWorkspaceActionTypes,
    WORKSPACE_SET_CURRENT_DESK_ID,
    WORKSPACE_SET_FILTER_PANEL_STATE,
    WORKSPACE_SET_DESK_SAMS_SETTINGS,
    WORKSPACE_SET_SINGLE_DESK_SAMS_SETTINGS,
} from './types';
import {IThunkAction} from '../types';
import {samsApi} from '../../apis';

// Redux Selectors
import {isFilterPanelOpen} from './selectors';

export function setFilterPanelState(isOpen: boolean): IWorkspaceActionTypes {
    return {
        type: WORKSPACE_SET_FILTER_PANEL_STATE,
        payload: isOpen,
    };
}

export function setCurrentDeskId(deskId: IDesk['_id'] | null): IWorkspaceActionTypes {
    return {
        type: WORKSPACE_SET_CURRENT_DESK_ID,
        payload: deskId,
    };
}

export function setDeskSamsSetings(settings: Dictionary<IDesk['_id'], IDesk['sams_settings']>): IWorkspaceActionTypes {
    return {
        type: WORKSPACE_SET_DESK_SAMS_SETTINGS,
        payload: settings,
    };
}

export function setSingleDeskSamsSettings(
    deskId: IDesk['_id'],
    settings: IDesk['sams_settings'],
): IWorkspaceActionTypes {
    return {
        type: WORKSPACE_SET_SINGLE_DESK_SAMS_SETTINGS,
        payload: {
            id: deskId,
            settings: settings,
        },
    };
}

export function toggleFilterPanelState(): IThunkAction<void> {
    return (dispatch, getState) => {
        const isOpen = !isFilterPanelOpen(getState());

        dispatch(setFilterPanelState(isOpen));

        return Promise.resolve();
    };
}

export function loadDesksSamsSettings(): IThunkAction<void> {
    return (dispatch) => {
        return samsApi.workspace.getDesksSamsSettings()
            .then((settings) => {
                dispatch(setDeskSamsSetings(settings));
            });
    };
}

export function loadSingleDeskSamsSettings(deskId: IDesk['_id']): IThunkAction<void> {
    return (dispatch) => {
        return samsApi.workspace.getSingleDeskSamsSettings(deskId)
            .then((settings) => {
                dispatch(setSingleDeskSamsSettings(deskId, settings));
            });
    };
}
