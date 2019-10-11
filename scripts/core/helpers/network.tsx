import React from 'react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {logger} from 'core/services/logger';
import {appConfig} from '../../appConfig';
import {showModal} from 'core/services/modalService';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {Modal} from 'core/ui/components/Modal/Modal';

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

function getNetworkErrorModal(message: string) {
    return class NetworkErrorModal extends React.PureComponent<{closeModal(): void}> {
        render() {
            return (
                <Modal>
                    <ModalHeader onClose={this.props.closeModal}>
                        {gettext('Network error occured')}
                    </ModalHeader>
                    <ModalBody>
                        {message}
                    </ModalBody>
                    <ModalFooter>
                        <button
                            onClick={this.props.closeModal}
                            className="btn btn-default"
                            type="button"
                        >
                            {gettext('Close')}
                        </button>
                    </ModalFooter>
                </Modal>
            );
        }
    };
}

function displayErrorMessage(res?: any) {
    showModal(getNetworkErrorModal(
        typeof res === 'object' && typeof res._error === 'object' && typeof res._error.message === 'string'
            ? res._error.message
            : gettext('An error occured. Retry the action or reload the page.'),
    ));
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

        displayErrorMessage();

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
                    displayErrorMessage();
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
                    displayErrorMessage(json);
                    return Promise.reject(json);
                }
            }));
        });
}
