// Types
import {IApplicationState} from '../index';

export function isFilterPanelOpen(state: IApplicationState): boolean {
    return state.workspace.filterPanelOpen;
}
