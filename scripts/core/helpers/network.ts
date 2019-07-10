import {logger} from 'core/services/logger';
import ng from 'core/services/ng';
import {appConfig} from '../../appConfig';

interface IHttpRequestOptions {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT';
    url: string; // absolute url
    payload?: {};
    headers?: {[key: string]: any};
}

//
//

function httpRequestBase(options: IHttpRequestOptions): Promise<Response> {
    const {method, url, payload, headers} = options;

    return fetch(url, {
        method,
        headers: headers || {},
        mode: 'cors',
        body: typeof payload === 'undefined' ? undefined : JSON.stringify(payload),
    })
        .then((res) => {
            if (res.ok) {
                return res;
            } else {
                throw new Error(`Server error occured. Status code: ${res.status}`);
            }
        })
        .catch((err) => {
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

export function httpRequest(options: IHttpRequestOptions): Promise<string> {
    return httpRequestBase(options).then((res) => res.text());
}

//
//

export function httpRequestJson<T>(options: IHttpRequestOptions): Promise<T> {
    return httpRequestBase({
        ...options,
        headers: {
            ...(options.headers || {}),
            'Content-Type': 'application/json',
        },
    }).then((res) => res.json());
}

interface IHttpRequestOptionsLocal extends Omit<IHttpRequestOptions, 'url'> {
    path: string; // relative to application server
}

export function httpRequestLocal(options: IHttpRequestOptionsLocal): Promise<string> {
    return ng.getService('session').then((session) => {
        return httpRequest({
            ...options,
            url: appConfig.server.url + options.path,
            headers: {...(options.headers || {}), ...{'Authorization': session.token}},
        });
    });
}

//
//

export function httpRequestJsonLocal<T>(options: IHttpRequestOptionsLocal): Promise<T> {
    return ng.getService('session')
        .then((session) => {
            return httpRequestJson<T>({
                ...options,
                url: appConfig.server.url + options.path,
                headers: {...(options.headers || {}), ...{'Authorization': session.token}},
            });
        });
}
