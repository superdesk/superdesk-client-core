import {combineReducers, createStore} from 'redux';
import {IBaseRestApiResponse, IResourceUpdateEvent, IWebsocketMessage} from 'superdesk-api';
import {addWebsocketEventListener} from 'core/notification/notification';
import {users, IUserState, IUserAction} from './users';
import {getMiddlewares} from 'core/redux-utils';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {debounceAsync, IDebounced} from 'core/helpers/debounce-async';

export type IEntityAction = {
    type: 'UPDATE_ENTITY',
    payload: {
        resource: string;
        _id: string;
        data: IBaseRestApiResponse;
    },
};

export interface IStoreState {
    users: IUserState;
}

type IAction = IUserAction;

export const store = createStore<IStoreState, IAction, {}, {}>(combineReducers({
    users,
}), getMiddlewares());

const updating: {[key: string]: IDebounced} = {};

const resourcesInStore = [
    'users',
];

addWebsocketEventListener(
    'resource:updated',
    (event: IWebsocketMessage<IResourceUpdateEvent>) => {
        const {resource, _id} = event.extra;

        if (!resourcesInStore.includes(resource)) {
            return;
        }

        const updateKey = resource + _id;

        if (updating[updateKey] != null) {
            updating[updateKey]();
        } else {
            const requestDebounced = debounceAsync(
                (abortController) => {
                    return httpRequestJsonLocal({
                        method: 'GET',
                        path: `/${resource}/${_id}`,
                        abortSignal: abortController.signal,
                    })
                        .then((data: IBaseRestApiResponse) => {
                            store.dispatch({
                                type: 'UPDATE_ENTITY',
                                payload: {
                                    resource,
                                    _id,
                                    data,
                                },
                            });
                        }).finally(() => {
                            delete updating[updateKey];
                        });
                },
                1000,
                3000,
            );

            updating[updateKey] = requestDebounced;
            updating[updateKey]();
        }
    },
);
