// External Modules
import {createStore, applyMiddleware, compose, Store, combineReducers} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {createLogger} from 'redux-logger';

// Redux Branches
import {setsBranch, setsInitialState} from './sets/branch';
import {storageDestinationsBranch, storageDestinationsInitialState} from './storageDestinations/branch';
import {getReducersFromBranchLeaf} from '../utils/redux';

export const rootReducer = combineReducers({
    sets: getReducersFromBranchLeaf(setsInitialState, setsBranch),
    storageDestinations: getReducersFromBranchLeaf(storageDestinationsInitialState, storageDestinationsBranch),
});

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
    initialState: {} = {},
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
        rootReducer,
        initialState,
        compose(applyMiddleware(...middlewares)),
    );
}
