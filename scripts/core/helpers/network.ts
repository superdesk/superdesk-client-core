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
    return x['_status'] === 'ERR';
}

function httpRequestBase(options: IHttpRequestOptions): Promise<Response> {
    const {method, url, payload, headers} = options;

    return fetch(url, {
        method,
        headers: headers || {},
        mode: 'cors',
        body: typeof payload === 'undefined' ? undefined : JSON.stringify(payload),
    }).catch((err) => {
        if (err instanceof Error) {
            logger.error(err);
        } else {
            logger.error(new Error(err));
        }

        // unless a rejected Promise is returned or an error is thrown in the catch block
        // the promise will become resolved and `.then chain` will get executed
        return Promise.reject(err);
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
