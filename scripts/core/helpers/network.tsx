import ng from 'core/services/ng';
import {appConfig} from '../../appConfig';

interface IHttpRequestOptions {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    url: string; // absolute url
    payload?: {};
    headers?: {[key: string]: any};
    urlParams?: {[key: string]: any};
    cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';

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
            const value = options.urlParams[key];

            if (typeof value !== 'undefined') {
                const stringified = typeof value === 'string'
                    ? value
                    : JSON.stringify(value);

                _url.searchParams.append(key, stringified);
            }
        });
    }

    return fetch(_url.toString(), {
        method,
        headers: headers || {},
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(payload || undefined), // works when `payload` is `undefined`
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
                    // Attempt to convert error response to JSON,
                    // otherwise return body as text as returned from the server
                    return res.text()
                        .then((bodyText) => {
                            try {
                                return Promise.reject(JSON.parse(bodyText));
                            } catch (_err) {
                                return Promise.reject(bodyText);
                            }
                        });
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

export function httpRequestRawLocal<T>(options: IHttpRequestOptionsLocal): Promise<Response> {
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
                    return res;
                } else {
                    return Promise.reject(res);
                }
            });
        });
}

export function uploadFileWithProgress<T>(
    endpoint: string,
    data: FormData,
    onProgress: (event: ProgressEvent) => void,
    method?: 'POST' | 'PATCH',
    etag?: string,
): Promise<T> {
    return ng.getService('session')
        .then((session) => {
            return new Promise<T>((resolve, reject) => {
                // Using `XMLHttpRequest` over `fetch` so we can get `onprogress` reporting
                const request = new XMLHttpRequest();
                const url = appConfig.server.url + endpoint;

                request.open(method ?? 'POST', url);
                request.setRequestHeader('Authorization', session.token);

                if (method === 'PATCH' && etag != null) {
                    request.setRequestHeader('If-Match', etag);
                }

                request.upload.onprogress = onProgress;

                request.onload = function() {
                    if (this.status >= 200 && this.status < 300) {
                        resolve(JSON.parse(this.responseText));
                    } else {
                        reject(JSON.parse(this.responseText));
                    }
                };

                request.onerror = function(e: ProgressEvent) {
                    reject(e);
                };

                request.send(data);
            });
        });
}
