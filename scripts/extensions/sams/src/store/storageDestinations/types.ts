// Types
import {IStorageDestinationItem} from '../../interfaces';

export const RECEIVE = 'storage_destinations_receive';
interface IReceiveStorageDestinationAction {
    type: typeof RECEIVE;
    payload: Array<IStorageDestinationItem>;
}

export type IStorageDestinationActionTypes = IReceiveStorageDestinationAction;

export interface IStorageDestinationState {
    destinations: Array<IStorageDestinationItem>;
}
