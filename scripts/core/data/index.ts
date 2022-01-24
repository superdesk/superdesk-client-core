import {combineReducers, createStore} from 'redux';
import {IBaseRestApiResponse, IResourceUpdateEvent, IWebsocketMessage} from 'superdesk-api';
import {addWebsocketEventListener} from 'core/notification/notification';
import {users, IUserState, IUserAction} from './users';
import {getMiddlewares} from 'core/redux-utils';
import {debounceAsync, IDebounced} from 'core/helpers/debounce-async';
import {requestQueue} from 'core/helpers/request-queue';

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
        const {resource, _id, fields} = event.extra;
        const fieldKeys = Object.keys(fields);

        if (!resourcesInStore.includes(resource)) {
            return;
        } else if (resource === 'users' &&
            fieldKeys.length === 1 &&
            fieldKeys[0] === 'last_activity_at' &&
            store.getState().users.entities[_id] != null
        ) {
            // This websocket message is purely to update a User's last_activity_at
            // So manually update the resource rather than sending an API request
            store.dispatch({
                type: 'UPDATE_USER_LAST_ACTIVE',
                payload: _id,
            });
            return;
        }

        const updateKey = resource + _id;

        if (updating[updateKey] != null) {
            updating[updateKey]();
        } else {
            const requestDebounced = debounceAsync(
                (abortController) => {
                    return requestQueue.add({
                        method: 'GET',
                        endpoint: `/${resource}/${_id}`,
                        abortSignal: abortController.signal,
                    }, store)
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
