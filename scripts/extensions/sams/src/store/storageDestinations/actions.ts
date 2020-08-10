// Types
import {IStorageDestinationItem} from '../../interfaces';
import {IThunkAction} from '../types';
import {RECEIVE, IStorageDestinationActionTypes} from './types';

export function receiveDestinations(destinations: Array<IStorageDestinationItem>): IStorageDestinationActionTypes {
    return {
        type: RECEIVE,
        payload: destinations,
    };
}

export function loadStorageDestinations(): IThunkAction<Array<IStorageDestinationItem>> {
    return (dispatch, _getState, {api}) => {
        return api.storageDestinations.getAll()
            .then((destinations: Array<IStorageDestinationItem>) => {
                dispatch(receiveDestinations(destinations));

                return Promise.resolve(destinations);
            });
    };
}
