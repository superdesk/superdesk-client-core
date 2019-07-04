import {logger} from "core/services/logger";
import ng from 'core/services/ng';
import {appConfig} from "appConfig";

interface IHttpRequestOptions {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT';
    url: string; // absolute url
    payload?: {};
    headers?: {[key: string]: any};
    onSuccess(responseText: string): void;
    onError?(xhr: XMLHttpRequest): void;
}

interface IHttpRequestReturnValue {
    abort(): void;
}

export function httpRequest(options: IHttpRequestOptions): IHttpRequestReturnValue {
    const {method, url, payload, headers, onSuccess, onError} = options;
    const xhr = new XMLHttpRequest();

    xhr.open(method, url, true);

    for (const headerName in headers) {
        xhr.setRequestHeader(headerName, headers[headerName]);
    }

    xhr.onload = function() {
        if (this.status >= 200 && this.status <= 300) {
            onSuccess(this.responseText);
        } else {
            let errorMessage = '';

            errorMessage += `Server error at ${url};`;
            errorMessage += ` with headers ${JSON.stringify(headers)};`;
            errorMessage += `with payload ${JSON.stringify(payload == null ? null : payload)}.`;

            logger.error(new Error(errorMessage));
        }
    };

    if (typeof onError === 'function') {
        xhr.onerror = function() {
            onError(xhr);
        };
    }

    if (typeof payload === 'undefined') {
        xhr.send();
    } else {
        xhr.send(JSON.stringify(payload));
    }

    return {
        abort: () => xhr.abort(),
    };
}

//

interface IHttpRequestJsonOptions<T> extends Omit<IHttpRequestOptions, 'onSuccess'> {
    onSuccess(responseJson: T): void;
}

export function httpRequestJson<T>(options: IHttpRequestJsonOptions<T>): IHttpRequestReturnValue {
    const onSuccess = (responseText: string) => {
        try {
            options.onSuccess(JSON.parse(responseText));
        } catch (e) {
            logger.error(e);
        }
    };

    return httpRequest({...options, onSuccess, headers: {...options.headers, ...{'Content-Type': 'application/json'}}});
}

//

interface IHttpRequestOptionsLocal extends Omit<IHttpRequestOptions, 'url'> {
    path: string; // relative to application server
}

export function httpRequestLocal(options: IHttpRequestOptionsLocal): Promise<IHttpRequestReturnValue> {
    return ng.getService('session').then((session) => {
        return httpRequest({
            ...options,
            url: appConfig.server.url + options.path,
            headers: {...(options.headers || {}), ...{'Authorization': session.token}},
        });
    });
}

//

interface IHttpRequestLocalJsonOptions<T> extends Omit<IHttpRequestOptionsLocal, 'onSuccess'> {
    onSuccess(responseJson: T): void;
}

export function httpRequestJsonLocal<T>(options: IHttpRequestLocalJsonOptions<T>): Promise<IHttpRequestReturnValue> {
    return ng.getService('session').then((session) => {
        return httpRequestJson<T>({
            ...options,
            url: appConfig.server.url + options.path,
            headers: {...(options.headers || {}), ...{'Authorization': session.token}},
        });
    });
}
