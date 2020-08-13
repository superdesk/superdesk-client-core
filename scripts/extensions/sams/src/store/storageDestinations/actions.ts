// Types
import {IStorageDestinationItem, IThunkAction} from '../../interfaces';

import {storageDestinationsBranch} from './branch';

export function loadStorageDestinations(): IThunkAction<Array<IStorageDestinationItem>> {
    return (dispatch, _getState, {api}) => {
        return api.storageDestinations.getAll()
            .then((destinations: Array<IStorageDestinationItem>) => {
                dispatch(storageDestinationsBranch.receive.action(destinations));

                return Promise.resolve(destinations);
            });
    };
}
