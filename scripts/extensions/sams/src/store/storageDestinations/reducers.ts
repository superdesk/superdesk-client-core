// Types
import {
    IStorageDestinationActionTypes,
    IStorageDestinationState,
    RECEIVE,
} from './types';

const initialState: IStorageDestinationState = {
    destinations: [],
};

export function storageDestinationReducer(
    state: IStorageDestinationState = initialState,
    action: IStorageDestinationActionTypes,
): IStorageDestinationState {
    switch (action.type) {
    case RECEIVE:
        return {
            ...state,
            destinations: action.payload,
        };
    default:
        return state;
    }
}
