// Types
import {IWorkspaceActionTypes, WORKSPACE_SET_FILTER_PANEL_STATE} from './types';
import {IThunkAction} from '../types';

// Redux Selectors
import {isFilterPanelOpen} from './selectors';

export function setFilterPanelState(isOpen: boolean): IWorkspaceActionTypes {
    return {
        type: WORKSPACE_SET_FILTER_PANEL_STATE,
        payload: isOpen,
    };
}

export function toggleFilterPanelState(): IThunkAction<void> {
    return (dispatch, getState) => {
        const isOpen = !isFilterPanelOpen(getState());

        dispatch(setFilterPanelState(isOpen));

        return Promise.resolve();
    };
}
