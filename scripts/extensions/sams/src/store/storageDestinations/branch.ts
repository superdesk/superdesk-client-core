// Types
import {IStorageDestinationItem, IApplicationState} from '../../interfaces';

// Utils
import {genBranchLeaf} from '../../utils/redux';

export const storageDestinationsInitialState: IApplicationState['storageDestinations'] = {
    destinations: [],
};

export const storageDestinationsBranch = {
    receive: genBranchLeaf<IApplicationState['storageDestinations'], Array<IStorageDestinationItem>>({
        id: 'storage_destinations__receive',
        reducer: (state, payload) => ({
            ...state,
            destinations: payload,
        }),
    }),
};
