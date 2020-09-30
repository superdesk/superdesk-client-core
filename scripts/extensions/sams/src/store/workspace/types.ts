
export const WORKSPACE_SET_FILTER_PANEL_STATE = 'workspace__set_filter_panel_state';
interface IWorkspaceSetFilterPanelStateAction {
    type: typeof WORKSPACE_SET_FILTER_PANEL_STATE;
    payload: boolean;
}

export type IWorkspaceActionTypes = IWorkspaceSetFilterPanelStateAction;

export interface IWorkspaceState {
    filterPanelOpen: boolean;
}
