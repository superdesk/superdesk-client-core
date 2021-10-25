// Types
import {IDesk} from 'superdesk-api';

export const WORKSPACE_SET_FILTER_PANEL_STATE = 'workspace__set_filter_panel_state';
interface IWorkspaceSetFilterPanelStateAction {
    type: typeof WORKSPACE_SET_FILTER_PANEL_STATE;
    payload: boolean;
}

export const WORKSPACE_SET_CURRENT_DESK_ID = 'workspace__set_current_desk_id';
interface IWorkspaceSetCurrentDeskIdAction {
    type: typeof WORKSPACE_SET_CURRENT_DESK_ID;
    payload: IDesk['_id'] | null;
}

export const WORKSPACE_SET_DESK_SAMS_SETTINGS = 'workspace__set_desk_sams_settings';
interface IWorkspaceSetDeskSamsSettingsAction {
    type: typeof WORKSPACE_SET_DESK_SAMS_SETTINGS;
    payload: Dictionary<IDesk['_id'], IDesk['sams_settings']>;
}

export const WORKSPACE_SET_SINGLE_DESK_SAMS_SETTINGS = 'workspace__set_single_desk_sams_settings';
interface IWorkspaceSetSingleDeskSamsSettingsAction {
    type: typeof WORKSPACE_SET_SINGLE_DESK_SAMS_SETTINGS;
    payload: {
        id: IDesk['_id'];
        settings: IDesk['sams_settings'];
    };
}

export type IWorkspaceActionTypes = IWorkspaceSetFilterPanelStateAction
    | IWorkspaceSetCurrentDeskIdAction
    | IWorkspaceSetDeskSamsSettingsAction
    | IWorkspaceSetSingleDeskSamsSettingsAction;

export interface IWorkspaceState {
    filterPanelOpen: boolean;
    currentDeskId: IDesk['_id'] | null;
    deskSamsSettings: Dictionary<IDesk['_id'], IDesk['sams_settings']>;
}
