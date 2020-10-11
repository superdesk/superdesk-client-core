import ng from 'core/services/ng';
import {logger} from 'core/services/logger';
import {appConfig} from '../../appConfig';

interface IHttpRequestOptions {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    url: string; // absolute url
    payload?: {};
    headers?: {[key: string]: any};
    urlParams?: {[key: string]: any};
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

export function httpRequestZipLocal<T>(options: IHttpRequestJsonOptionsLocal): Promise<void> {
    const saveByteArray = (function () {
        const a = document.createElement("a");
        document.body.appendChild(a);
        return function (data) {
            const blob = new Blob([data], {type: "application/zip"}),
            url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = 'example';
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());
    return ng.getService('session')
        .then((session) => {
            return httpRequestBase({
                ...options,
                url: appConfig.server.url + options.path,
                headers: {
                    ...(options.headers || {}),
                    'Authorization': session.token,
                },
            }).then((res) => res.arrayBuffer().then((blob: any) => {
                if (res.ok) {
                    saveByteArray(blob);
                    return Promise.resolve();
                } else {
                    return Promise.reject();
                }
            }));
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
