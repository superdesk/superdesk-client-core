import thunk from 'redux-thunk';
import {createLogger} from 'redux-logger';
import {applyMiddleware, StoreEnhancer} from 'redux';

export function getMiddlewares(): StoreEnhancer {
    const middlewares = [thunk];

    const devtools = localStorage.getItem('devtools');
    const reduxLoggerEnabled =
        devtools == null
            ? false
            : JSON.parse(devtools).includes('redux-logger');

    if (reduxLoggerEnabled) {
        // (this should always be the last middleware)
        middlewares.push(createLogger());
    }

    return applyMiddleware(...middlewares);
}
