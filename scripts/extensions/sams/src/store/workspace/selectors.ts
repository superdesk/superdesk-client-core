// External Modules
import {createSelector} from 'reselect';

// Types
import {IDesk} from 'superdesk-api';
import {ISetItem} from '../../interfaces';
import {IApplicationState} from '../index';

export function isFilterPanelOpen(state: IApplicationState): boolean {
    return state.workspace.filterPanelOpen;
}

export function getCurrentDeskId(state: IApplicationState): IDesk['_id'] | null {
    return state.workspace.currentDeskId;
}

export function getDesksSamsSettings(state: IApplicationState): Dictionary<IDesk['_id'], IDesk['sams_settings']> {
    return state.workspace.deskSamsSettings;
}

export const getDesksAllowedSets = createSelector<
    IApplicationState,
    Dictionary<IDesk['_id'], IDesk['sams_settings']>,
    Dictionary<ISetItem['_id'], Array<IDesk['_id']>>
>(
    [getDesksSamsSettings],
    (deskSettings) => (
        Object.keys(deskSettings).reduce<Dictionary<ISetItem['_id'], Array<IDesk['_id']>>>(
            (items, deskId) => {
                (deskSettings[deskId]?.allowed_sets ?? []).forEach(
                    (setId) => {
                        if (items[setId] == null) {
                            items[setId] = [deskId];
                        } else {
                            items[setId].push(deskId);
                        }
                    },
                );

                return items;
            },
            {},
        )
    ),
);
