import ng from 'core/services/ng';
import {logger} from 'core/services/logger';
import {appConfig} from '../../appConfig';

interface IHttpRequestOptions {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    url: string; // absolute url
    payload?: {};
    headers?: {[key: string]: any};
}

interface IHttpRequestOptionsLocal extends Omit<IHttpRequestOptions, 'url'> {
    path: string; // relative to application server
}

interface IHttpRequestJsonOptionsLocal extends IHttpRequestOptionsLocal {
    // JSON not available with DELETE method
    method: 'GET' | 'POST' | 'PATCH' | 'PUT';
}

interface IHttpLocalApiErrorResponse {
    _error: {
        code: number;
        message: string;
    };
    _issues: {[key: string]: any};
    _status: 'ERR' | string;
}

export function isHttpApiError(x): x is IHttpLocalApiErrorResponse {
    return typeof x === 'object' && x['_status'] === 'ERR';
}

function httpRequestBase(options: IHttpRequestOptions): Promise<Response> {
    const {method, url, payload, headers} = options;

    return fetch(url, {
        method,
        headers: headers || {},
        mode: 'cors',
        body: JSON.stringify(payload), // works when `payload` is `undefined`
    }).catch((res) => {
        if (res instanceof Error) {
            logger.error(res);
        } else {
            logger.error(new Error(res));
        }

        // unless a rejected Promise is returned or an error is thrown in the catch block
        // the promise will become resolved and `.then chain` will get executed
        return Promise.reject(res);
    });
}

export function httpRequestVoidLocal(options: IHttpRequestOptionsLocal): Promise<void> {
    return ng.getService('session')
        .then((session) => {
            return httpRequestBase({
                ...options,
                url: appConfig.server.url + options.path,
                headers: {
                    ...(options.headers || {}),
                    'Authorization': session.token,
                },
            }).then((res) => {
                if (res.ok) {
                    return Promise.resolve();
                } else {
                    return Promise.reject();
                }
            });
        });
}

export function httpRequestJsonLocal<T>(options: IHttpRequestJsonOptionsLocal): Promise<T> {
    return ng.getService('session')
        .then((session) => {
            return httpRequestBase({
                ...options,
                url: appConfig.server.url + options.path,
                headers: {
                    ...(options.headers || {}),
                    'Content-Type': 'application/json',
                    'Authorization': session.token,
                },
            }).then((res) => res.json().then((json) => {
                if (res.ok) {
                    return json;
                } else {
                    return Promise.reject(json);
                }
            }));
        });
}
