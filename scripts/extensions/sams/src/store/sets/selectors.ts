// External Modules
import {createSelector} from 'reselect';

// Types
import {IApplicationState} from '../index';
import {
    CONTENT_PANEL_STATE,
    ISetItem,
    IStorageDestinationItem,
    SET_STATE,
} from '../../interfaces';

// Redux Selectors
import {getStorageDestinationsById} from '../storageDestinations/selectors';

// Utils
import {assertNever} from '../../utils/typescript';

type ISetArrays = {
    draft: Array<ISetItem>;
    usable: Array<ISetItem>;
    disabled: Array<ISetItem>;
};

export function getSets(state: IApplicationState): Array<ISetItem> {
    return state.sets.sets;
}

export function getActiveSets(state: IApplicationState): Array<ISetItem> {
    return state.sets.sets.filter(
        (set) => set.state === SET_STATE.USABLE,
    );
}

export function getDisabledSets(state: IApplicationState): Array<ISetItem> {
    return state.sets.sets.filter(
        (set) => set.state === SET_STATE.DISABLED,
    );
}

export function getDisabledSetIds(state: IApplicationState): Array<string> {
    const disabledSets = getDisabledSets(state);

    let disabledSetIds: Array<string> = [];

    disabledSets.forEach((set) => {
        disabledSetIds.push(set._id);
    });
    return disabledSetIds;
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
                groupedSets.draft.push(set);
                break;
            default:
                assertNever(set.state);
            }
        });

        return groupedSets;
    },
);

export function getAssetsCountForSets(state: IApplicationState): Dictionary<string, number> {
    return state.sets.counts;
}

export const getSelectedSetCount = createSelector<
    IApplicationState,
    Dictionary<string, number>,
    string | undefined,
    number | undefined
>(
    [getAssetsCountForSets, getSelectedSetId],
    (counts: Dictionary<string, number>, setId?: string) => (
        setId != null ?
            counts?.[setId] :
            undefined
    ),
);
