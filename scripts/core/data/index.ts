import {createStore} from 'redux';
import {IBaseRestApiResponse, IResourceUpdateEvent, IUser, IWebsocketMessage} from 'superdesk-api';
import {addWebsocketEventListener} from 'core/notification/notification';
import {getMiddlewares} from 'core/redux-utils';
import {debounceAsync, IDebounced} from 'core/helpers/debounce-async';
import {requestQueue} from 'core/helpers/request-queue';
import {keyBy} from 'lodash';

/**
 * To add a new entity, add it to
 * resourcesInStore, IInterfacesByResourceType
 * and call `initEntity`
 */

const resourcesInStore = [
    'users',
] as const;

interface IInterfacesByResourceType {
    users: IUser;
}

type IStoreResource = typeof resourcesInStore[number];

export type IStoreState = {
    [Properties in keyof IInterfacesByResourceType]: {
        entities: {
            [key: string]: IInterfacesByResourceType[Properties];
        };
    };
};

type IUpdateEntityAction = {
    type: 'UPDATE_ENTITY',
    payload: {
        resource: IStoreResource;
        _id: string;
        data: any;
    },
};

interface IInitEntityAction {
    type: 'INIT_ENTITY';
    payload: {
        resource: string;
        items: Array<any>;
    };
}

interface IUpdateLastUserActiveAction {
    type: 'UPDATE_USER_LAST_ACTIVE';
    payload: IUser['_id'];
}

type IUserAction = IUpdateLastUserActiveAction;

type IAction = IUserAction | IUpdateEntityAction | IInitEntityAction;

const initialState: IStoreState = {
    users: {
        entities: {},
    },
};

function isStoreResource(resource: any): resource is IStoreResource {
    return resourcesInStore.includes(resource);
}

function reducer(state: IStoreState = initialState, action: IAction): IStoreState {
    switch (action.type) {
    /**
     * USER ACTIONS
     */
    case 'UPDATE_USER_LAST_ACTIVE':
        return (() => {
            const userId = action.payload;

            return {
                ...state,
                users: {
                    entities: {
                        ...state.users.entities,
                        [userId]: {
                            ...state.users.entities[userId],
                            last_activity_at: (new Date()).toISOString(),
                        },
                    },
                },
            };
        })();

    /**
     * GENERIC ACTIONS THAT APPLY TO ALL ENTITIES
     */
    case 'INIT_ENTITY':
        return (() => {
            const {resource, items} = action.payload;

            return {
                ...state,
                [resource]: {
                    entities: keyBy(items, (entity) => entity._id),
                },
            };
        })();

    case 'UPDATE_ENTITY':
        return (() => {
            const resource = action.payload.resource;
            const entity = action.payload.data;

            return {
                ...state,
                [resource]: {
                    entities: {
                        ...state[resource].entities,
                        [entity._id]: entity,
                    },
                },
            };
        })();

    default:
        return state;
    }
}

export const store = createStore<IStoreState, IAction, {}, {}>(reducer, getMiddlewares());

export function initEntity<T extends IStoreResource>(
    resource: T,
    items: Array<IInterfacesByResourceType[T]>,
) {
    store.dispatch({
        type: 'INIT_ENTITY',
        payload: {
            resource,
            items,
        },
    });
}

const updating: {[key: string]: IDebounced} = {};

addWebsocketEventListener(
    'resource:updated',
    (event: IWebsocketMessage<IResourceUpdateEvent>) => {
        const {resource, _id, fields} = event.extra;
        const fieldKeys = Object.keys(fields);

        if (!isStoreResource(resource)) {
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
