import {IRestApiResponse} from 'superdesk-api';
import {IContentList, IContentListItem, IItemChange, IWebhook} from './interfaces';
import {superdesk} from './superdesk';

const {httpRequestJsonLocal, httpRequestVoidLocal} = superdesk;

const CONTENT_LISTS_RESOURCE = '/content_lists';
const WEBHOOKS_RESOURCE = '/content_list_webhooks';

interface IApiError {
    // Eve resource routes wrap the status in `_error`
    _error?: {
        code?: number;
        message?: string;
    };

    // endpoints served by the async core framework (e.g. the bulk items PATCH)
    // are serialized by SuperdeskApiError.to_dict(), which has no `_error`;
    // the status is appended as `internal_error` instead
    internal_error?: number;

    _status?: string;
}

export function isConflictError(error: unknown): boolean {
    if (typeof error !== 'object' || error == null) {
        return false;
    }

    const apiError = error as IApiError;

    return apiError._error?.code === 409 || apiError.internal_error === 409;
}

export function fetchLists(): Promise<Array<IContentList>> {
    return httpRequestJsonLocal<IRestApiResponse<IContentList>>({
        method: 'GET',
        path: CONTENT_LISTS_RESOURCE,
        urlParams: {max_results: 200},
    }).then((response) => {
        return response._items
            .filter((list) => list.type === 'manual')
            .sort((a, b) => a.name.localeCompare(b.name));
    });
}

export function getList(listId: string): Promise<IContentList> {
    return httpRequestJsonLocal<IContentList>({
        method: 'GET',
        path: `${CONTENT_LISTS_RESOURCE}/${listId}`,
    });
}

export function createList(name: string): Promise<IContentList> {
    return httpRequestJsonLocal<IContentList>({
        method: 'POST',
        path: CONTENT_LISTS_RESOURCE,
        payload: {name, type: 'manual'},
    });
}

export function updateList(list: IContentList, patch: Partial<IContentList>): Promise<IContentList> {
    return httpRequestJsonLocal<IContentList>({
        method: 'PATCH',
        path: `${CONTENT_LISTS_RESOURCE}/${list._id}`,
        payload: patch,
        headers: {'If-Match': list._etag},
    });
}

export function deleteList(list: IContentList): Promise<void> {
    return httpRequestVoidLocal({
        method: 'DELETE',
        path: `${CONTENT_LISTS_RESOURCE}/${list._id}`,
        headers: {'If-Match': list._etag},
    });
}

export function fetchListItems(
    listId: string,
    options?: {page?: number; maxResults?: number},
): Promise<IRestApiResponse<IContentListItem>> {
    return httpRequestJsonLocal<IRestApiResponse<IContentListItem>>({
        method: 'GET',
        path: `${CONTENT_LISTS_RESOURCE}/${listId}/items`,
        urlParams: {
            max_results: options?.maxResults ?? 200,
            page: options?.page ?? 1,
        },
    }).then((response) => ({
        ...response,
        _items: [...response._items].sort((a, b) => a.position - b.position),
    }));
}

export function saveItemChanges(
    listId: string,
    updatedAt: string | null,
    items: Array<IItemChange>,
): Promise<IContentList> {
    return httpRequestJsonLocal<IContentList>({
        method: 'PATCH',
        path: `${CONTENT_LISTS_RESOURCE}/${listId}/items`,
        payload: {updatedAt, items},
    });
}

export function fetchWebhooks(): Promise<Array<IWebhook>> {
    return httpRequestJsonLocal<IRestApiResponse<IWebhook>>({
        method: 'GET',
        path: WEBHOOKS_RESOURCE,
        urlParams: {max_results: 200},
    }).then((response) => response._items);
}

export function createWebhook(payload: Partial<IWebhook>): Promise<IWebhook> {
    return httpRequestJsonLocal<IWebhook>({
        method: 'POST',
        path: WEBHOOKS_RESOURCE,
        payload,
    });
}

export function updateWebhook(webhook: IWebhook, patch: Partial<IWebhook>): Promise<IWebhook> {
    return httpRequestJsonLocal<IWebhook>({
        method: 'PATCH',
        path: `${WEBHOOKS_RESOURCE}/${webhook._id}`,
        payload: patch,
        headers: {'If-Match': webhook._etag},
    });
}

export function deleteWebhook(webhook: IWebhook): Promise<void> {
    return httpRequestVoidLocal({
        method: 'DELETE',
        path: `${WEBHOOKS_RESOURCE}/${webhook._id}`,
        headers: {'If-Match': webhook._etag},
    });
}
