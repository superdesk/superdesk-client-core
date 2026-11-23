import {httpRequestRawLocal} from 'core/helpers/network';
import type {IAIProvider} from 'apps/ai-providers/interfaces';
import type {IAIAction, IAIActionOptions, IAIActionPayload} from './interfaces';

/** Largest page the server returns */
const PAGE_SIZE = 200;

/** Keeps the status, which `core/helpers/network` drops, so a `412` can be told apart */
export class AIStudioRequestError {
    status: number;
    body: unknown;

    constructor(status: number, body: unknown) {
        this.status = status;
        this.body = body;
    }
}

function readBody(response: Response): Promise<unknown> {
    return response.text().then((text) => {
        if (text.trim() === '') {
            return null;
        }

        try {
            return JSON.parse(text);
        } catch (_error) {
            return text;
        }
    });
}

function request<T>(options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    payload?: {};
    etag?: string;
    urlParams?: {[key: string]: any};
}): Promise<T> {
    const headers: {[key: string]: string} = {};

    if (options.payload != null) {
        headers['Content-Type'] = 'application/json';
    }

    if (options.etag != null) {
        headers['If-Match'] = options.etag;
    }

    return httpRequestRawLocal({
        method: options.method,
        path: options.path,
        payload: options.payload,
        urlParams: options.urlParams,
        headers,
    }).then(
        (response) => readBody(response) as Promise<T>,
        (error) => {
            if (error instanceof Response) {
                return readBody(error).then((body) => Promise.reject(new AIStudioRequestError(error.status, body)));
            }

            return Promise.reject(error);
        },
    );
}

interface IListResponse<T> {
    _items: Array<T>;
    _meta?: {total?: number};
}

function getAllPages<T>(path: string, page = 1, collected: Array<T> = []): Promise<Array<T>> {
    return request<IListResponse<T>>({
        method: 'GET',
        path,
        urlParams: {max_results: PAGE_SIZE, page},
    }).then((response) => {
        const items = [...collected, ...response._items];
        const total = response._meta?.total ?? items.length;

        return response._items.length > 0 && items.length < total
            ? getAllPages(path, page + 1, items)
            : items;
    });
}

export function getActions(): Promise<Array<IAIAction>> {
    return getAllPages<IAIAction>('/ai_actions');
}

export function getAction(id: IAIAction['_id']): Promise<IAIAction> {
    return request<IAIAction>({method: 'GET', path: `/ai_actions/${id}`});
}

export function getActionOptions(): Promise<IAIActionOptions> {
    return request<IAIActionOptions>({method: 'GET', path: '/ai_actions/options'});
}

export function getProviders(): Promise<Array<IAIProvider>> {
    return getAllPages<IAIProvider>('/ai_providers');
}

export function createAction(payload: IAIActionPayload): Promise<IAIAction> {
    return request<IAIAction>({method: 'POST', path: '/ai_actions', payload});
}

export function patchAction(action: IAIAction, patch: IAIActionPayload): Promise<IAIAction> {
    return request<IAIAction>({
        method: 'PATCH',
        path: `/ai_actions/${action._id}`,
        payload: patch,
        etag: action._etag,
    });
}

export function deleteAction(action: IAIAction): Promise<void> {
    return request<void>({
        method: 'DELETE',
        path: `/ai_actions/${action._id}`,
        etag: action._etag,
    });
}
