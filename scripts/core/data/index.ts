import loggerMiddleware from 'redux-logger';
import {combineReducers, createStore, applyMiddleware, compose} from 'redux';
import {IResourceUpdateEvent, IWebsocketMessage} from 'superdesk-api';
import {addWebsocketEventListener} from 'core/notification/notification';
import {dataApi} from 'core/helpers/CrudManager';
import users from './users';

export interface IAction {
    type: string;
    payload: any;
}

const store = createStore(combineReducers({
    users,
}), compose(applyMiddleware(loggerMiddleware)));

export type StoreState = ReturnType<typeof store.getState>;

const RESOURCE_BLACKLIST = [
    'auth',
    'audit',
];

addWebsocketEventListener(
    'resource:updated',
    (event: IWebsocketMessage<IResourceUpdateEvent>) => {
        const {resource, _id} = event.extra;

        if (RESOURCE_BLACKLIST.includes(resource)) {
            return;
        }

        dataApi.findOne(resource, _id).then((updated) => {
            store.dispatch({
                type: `UPDATE_${resource.toUpperCase()}`,
                payload: updated,
            });
        }, (reason) => {
            console.error(`got error when fetching ${resource}/${_id}: ${reason}`);
        });
    },
);

export default store;
