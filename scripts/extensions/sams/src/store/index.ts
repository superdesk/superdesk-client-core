// External Modules
import {createStore, applyMiddleware, compose, Reducer, Store, combineReducers} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {createLogger} from 'redux-logger';

// Types
import {ISetState} from './sets/types';
import {IStorageDestinationState} from './storageDestinations/types';

// Redux Reducers
import {setsReducer} from './sets/reducers';
import {storageDestinationReducer} from './storageDestinations/reducers';

export const rootReducer = combineReducers({
    sets: setsReducer,
    storageDestinations: storageDestinationReducer,
});

export type IApplicationState = {
    sets: ISetState;
    storageDestinations: IStorageDestinationState;
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

export function createReduxStore(
    extraArguments: any,
    initialState: {},
    reducer: Reducer,
): Store {
    const middlewares = [
        crashReporter,
        thunkMiddleware.withExtraArgument(extraArguments),
    ];

    if (process.env.NODE_ENV !== 'production') {
        // activate logs actions for non production instances.
        // (this should always be the last middleware)
        middlewares.push(createLogger());
    }

    return createStore(
        reducer,
        initialState,
        compose(applyMiddleware(...middlewares)),
    );
}
