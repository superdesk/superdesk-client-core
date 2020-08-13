// External Modules
import {createSelector} from 'reselect';

// Types
import {
    CONTENT_PANEL_STATE,
    ISetItem,
    IStorageDestinationItem,
    SET_STATE,
    IApplicationState,
} from '../../interfaces';

import {getStorageDestinationsById} from '../storageDestinations/selectors';

type ISetArrays = {
    draft: Array<ISetItem>;
    usable: Array<ISetItem>;
    disabled: Array<ISetItem>;
};

export function getSets(state: IApplicationState): Array<ISetItem> {
    return state.sets.sets ?? [];
}

export const getSetsById = createSelector<IApplicationState, Array<ISetItem>, Dictionary<string, ISetItem>>(
    [getSets],
    (sets: Array<ISetItem>) => {
        return sets.reduce<Dictionary<string, ISetItem>>(
            (items: Dictionary<string, ISetItem>, set: ISetItem) => {
                items[set._id] = set;

                return items;
            },
            {},
        );
    },
);

export function getSetContentPanelState(state: IApplicationState): CONTENT_PANEL_STATE {
    return state.sets.contentPanelState ?? CONTENT_PANEL_STATE.CLOSED;
}

export function getSelectedSetId(state: IApplicationState): string| undefined {
    return state.sets.selectedSetId;
}

export const getSelectedSet = createSelector<
    IApplicationState,
    Dictionary<string, ISetItem>,
    string | undefined,
    ISetItem | undefined
>(
    [getSetsById, getSelectedSetId],
    (sets: Dictionary<string, ISetItem>, setId?: string) => (
        setId != null ?
            sets?.[setId] :
            undefined
    ),
);

export const getSelectedSetStorageDestination = createSelector<
    IApplicationState,
    ISetItem | undefined,
    Dictionary<string, IStorageDestinationItem>,
    IStorageDestinationItem | undefined
>(
    [getSelectedSet, getStorageDestinationsById],
    (set: ISetItem | undefined, destinations: Dictionary<string, IStorageDestinationItem>) => (
        set?.destination_name != null ?
            destinations?.[set?.destination_name] :
            undefined
    ),
);

export const getSetsGroupedByState = createSelector<IApplicationState, Array<ISetItem>, ISetArrays>(
    [getSets],
    (sets: Array<ISetItem>) => {
        const groupedSets: ISetArrays = {
            draft: [],
            usable: [],
            disabled: [],
        };

        sets.forEach((set: ISetItem) => {
            switch (set.state) {
            case SET_STATE.USABLE:
                groupedSets.usable.push(set);
                break;
            case SET_STATE.DISABLED:
                groupedSets.disabled.push(set);
                break;
            case SET_STATE.DRAFT:
            default:
                groupedSets.draft.push(set);
                break;
            }
        });

        return groupedSets;
    },
);
