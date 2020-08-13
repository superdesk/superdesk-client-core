// External Modules
import {createSelector} from 'reselect';

// Types
import {IStorageDestinationItem} from '../../interfaces';
import {IApplicationState} from '../index';

export function getStorageDestinations(state: IApplicationState): Array<IStorageDestinationItem> {
    return state.storageDestinations.destinations ?? [];
}

export const getStorageDestinationsById = createSelector<
    IApplicationState,
    Array<IStorageDestinationItem>,
    Dictionary<string, IStorageDestinationItem>
>(
    [getStorageDestinations],
    (destinations: Array<IStorageDestinationItem>) => {
        return destinations.reduce<Dictionary<string, IStorageDestinationItem>>(
            (items, destination: IStorageDestinationItem) => {
                items[destination._id] = destination;

                return items;
            },
            {},
        );
    },
);
