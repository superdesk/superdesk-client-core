import ng from 'core/services/ng';
import {logger} from 'core/services/logger';
import {appConfig} from '../../appConfig';

interface IHttpRequestOptions {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    url: string; // absolute url
    payload?: {};
    headers?: {[key: string]: any};
    urlParams?: {[key: string]: any};

    abortSignal?: AbortSignal;
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
    const {method, url, payload, headers, abortSignal} = options;

    const _url = new URL(url);

    if (options.urlParams != null) {
        Object.keys(options.urlParams).forEach((key) => {
            _url.searchParams.append(key, options.urlParams[key]);
        });
    }

    return fetch(_url.toString(), {
        method,
        headers: headers || {},
        mode: 'cors',
        body: JSON.stringify(payload), // works when `payload` is `undefined`
        signal: abortSignal,
    });
}

export function httpRequestVoidLocal(options: IHttpRequestOptionsLocal): Promise<void> {
    return ng.getService('session')
        .then((session) => {
            return httpRequestBase({
                ...options,
                url: appConfig.server.url + options.path,
                urlParams: options.urlParams,
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
