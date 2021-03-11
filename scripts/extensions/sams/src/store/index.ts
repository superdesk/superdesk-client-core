// External Modules
import {createStore, applyMiddleware, compose, combineReducers} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {createLogger} from 'redux-logger';

// Types
import {Reducer, Store, Middleware} from 'redux';
import {ISetState} from './sets/types';
import {IStorageDestinationState} from './storageDestinations/types';
import {IAssetState} from './assets/types';
import {IWorkspaceState} from './workspace/types';

// Redux Reducers
import {setsReducer} from './sets/reducers';
import {storageDestinationReducer} from './storageDestinations/reducers';
import {assetsReducer} from './assets/reducers';
import {workspaceReducer} from './workspace/reducers';

import {registerWebsocketNotifications, deregisterWebsocketListeners} from '../notifications';

export const rootReducer = combineReducers({
    sets: setsReducer,
    storageDestinations: storageDestinationReducer,
    assets: assetsReducer,
    workspace: workspaceReducer,
});

export type IApplicationState = {
    sets: ISetState;
    storageDestinations: IStorageDestinationState;
    assets: IAssetState;
    workspace: IWorkspaceState;
};

/**
 * Some action dispatchers (specifically thunk with promises)
 * do not catch javascript exceptions.
 * This middleware ensures that uncaught exceptions are still thrown
 * displaying the error in the console.
 */
function crashReporter() {
    return function(next: any) {
        return function(action: any) {
            // eslint-disable-next-line no-useless-catch
            try {
                return next(action);
            } catch (error) {
                throw error;
            }
        };
    };
}

let store: Store | undefined;
let storeReferenceCount: number = 0;

export function createReduxStore(
    initialState: {},
    reducer: Reducer,
): Store {
    const middlewares: Array<Middleware> = [
        crashReporter,
        thunkMiddleware,
    ];

    if (process.env.NODE_ENV !== 'production') {
        // activate logs actions for non production instances.
        // (this should always be the last middleware)
        middlewares.push(createLogger());
    }
    registerWebsocketNotifications();
    store = createStore(
        reducer,
        initialState,
        compose(applyMiddleware(...middlewares)),
    );

    return store;
}

export function getStoreSingleton(): Store {
    if (store === undefined) {
        store = createReduxStore({}, rootReducer);
    }

    storeReferenceCount += 1;

    return store;
}

export function getStore(): Store | undefined {
    return store;
}

export function unsetStore() {
    storeReferenceCount -= 1;

    if (storeReferenceCount === 0) {
        deregisterWebsocketListeners();
        store = undefined;
    }
}
