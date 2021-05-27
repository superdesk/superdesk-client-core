import {combineReducers, createStore} from 'redux';
import {IBaseRestApiResponse, IResourceUpdateEvent, IWebsocketMessage} from 'superdesk-api';
import {addWebsocketEventListener} from 'core/notification/notification';
import {dataApi} from 'core/helpers/CrudManager';
import {users, IUserState, IUserAction} from './users';
import {getMiddlewares} from 'core/redux-utils';

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

const pendingUpdates: {[key: string]: Promise<any>} = {};

addWebsocketEventListener(
    'resource:updated',
    (event: IWebsocketMessage<IResourceUpdateEvent>) => {
        const {resource, _id} = event.extra;

        const RESOURCE_BLACKLIST = [
            'auth',
            'audit',
        ];

        if (RESOURCE_BLACKLIST.includes(resource)) {
            return;
        }

        const updateKey = `${resource}/${_id}`;

        if (pendingUpdates[updateKey]) {
            return;
        }

        pendingUpdates[updateKey] = dataApi.findOne(resource, _id)
            .then((data: IBaseRestApiResponse) => {
                store.dispatch({
                    type: 'UPDATE_ENTITY',
                    payload: {
                        resource,
                        _id,
                        data,
                    },
                });
            }, (reason) => {
                console.error(`got error when fetching ${resource}/${_id}: ${reason}`);
            })
            .finally(() => {
                pendingUpdates[updateKey] = null;
            });
    },
);
