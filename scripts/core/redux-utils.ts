import thunk from 'redux-thunk';
import {createLogger} from 'redux-logger';
import {applyMiddleware, StoreEnhancer} from 'redux';
import {DEV_TOOLS} from './constants';

export function getMiddlewares(): StoreEnhancer {
    const middlewares = [thunk];

    if (DEV_TOOLS.reduxLoggerEnabled) {
        // (this should always be the last middleware)
        middlewares.push(createLogger());
    }

    return applyMiddleware(...middlewares);
}
