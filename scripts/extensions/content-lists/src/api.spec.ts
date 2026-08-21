import {
    createList,
    createWebhook,
    deleteList,
    deleteWebhook,
    fetchLists,
    fetchListItems,
    fetchWebhooks,
    getList,
    isConflictError,
    saveItemChanges,
    updateList,
    updateWebhook,
} from './api';
import {IContentList, IContentListItem, IWebhook} from './interfaces';
import {superdeskMock} from './tests/superdesk-mock';

function restApiFields(id: string) {
    return {
        _id: id,
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-01T00:00:00+0000',
        _etag: `etag-${id}`,
        _links: {},
    };
}

function list(id: string, overrides: Partial<IContentList> = {}): IContentList {
    return {
        ...restApiFields(id),
        name: id,
        type: 'manual',
        ...overrides,
    };
}

function listItem(id: string, position: number): IContentListItem {
    return {
        ...restApiFields(id),
        content: `content-${id}`,
        position,
    };
}

function webhook(id: string, overrides: Partial<IWebhook> = {}): IWebhook {
    return {
        ...restApiFields(id),
        url: `https://example.com/${id}`,
        ...overrides,
    };
}

function respondWith(items: Array<{}>, total?: number): jasmine.Spy {
    return spyOn(superdeskMock, 'httpRequestJsonLocal').and.returnValue(
        Promise.resolve({
            _items: items,
            _meta: {total: total ?? items.length, page: 1, max_results: 200},
            _links: {},
        }),
    );
}

describe('isConflictError', () => {
    it('recognizes a 409 error payload', () => {
        expect(isConflictError({_error: {code: 409, message: 'conflict'}})).toBe(true);
    });

    it('rejects other errors', () => {
        expect(isConflictError({_error: {code: 412}})).toBe(false);
        expect(isConflictError({})).toBe(false);
        expect(isConflictError(null)).toBe(false);
        expect(isConflictError('conflict')).toBe(false);
        expect(isConflictError(new Error('conflict'))).toBe(false);
    });
});

describe('fetchLists', () => {
    it('requests content lists and keeps only manual lists, sorted by name', (done) => {
        const httpSpy = respondWith([
            list('b', {name: 'Beta'}),
            list('auto', {name: 'Automatic', type: 'automatic'}),
            list('a', {name: 'Alpha'}),
        ]);

        fetchLists().then((lists) => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'GET',
                path: '/content_lists',
                urlParams: {max_results: 200},
            });
            expect(lists.map(({name}) => name)).toEqual(['Alpha', 'Beta']);

            done();
        });
    });
});

describe('getList', () => {
    it('requests a single list by id', (done) => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal')
            .and.returnValue(Promise.resolve(list('list-1')));

        getList('list-1').then((result) => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'GET',
                path: '/content_lists/list-1',
            });
            expect(result._id).toBe('list-1');

            done();
        });
    });
});

describe('createList', () => {
    it('creates a manual list with the given name', (done) => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal')
            .and.returnValue(Promise.resolve(list('new')));

        createList('My list').then(() => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'POST',
                path: '/content_lists',
                payload: {name: 'My list', type: 'manual'},
            });

            done();
        });
    });
});

describe('updateList', () => {
    it('patches the list using its etag for concurrency control', (done) => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal')
            .and.returnValue(Promise.resolve(list('list-1')));

        updateList(list('list-1'), {name: 'Renamed'}).then(() => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'PATCH',
                path: '/content_lists/list-1',
                payload: {name: 'Renamed'},
                headers: {'If-Match': 'etag-list-1'},
            });

            done();
        });
    });
});

describe('deleteList', () => {
    it('deletes the list using its etag', (done) => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestVoidLocal')
            .and.returnValue(Promise.resolve());

        deleteList(list('list-1')).then(() => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'DELETE',
                path: '/content_lists/list-1',
                headers: {'If-Match': 'etag-list-1'},
            });

            done();
        });
    });
});

describe('fetchListItems', () => {
    it('requests items with default paging and sorts them by position', (done) => {
        const httpSpy = respondWith([
            listItem('c', 2),
            listItem('a', 0),
            listItem('b', 1),
        ]);

        fetchListItems('list-1').then((response) => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'GET',
                path: '/content_lists/list-1/items',
                urlParams: {max_results: 200, page: 1},
            });
            expect(response._items.map(({position}) => position)).toEqual([0, 1, 2]);

            done();
        });
    });

    it('passes custom paging options', (done) => {
        const httpSpy = respondWith([]);

        fetchListItems('list-1', {page: 3, maxResults: 5}).then(() => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'GET',
                path: '/content_lists/list-1/items',
                urlParams: {max_results: 5, page: 3},
            });

            done();
        });
    });
});

describe('saveItemChanges', () => {
    it('patches the items sub-resource with the change record', (done) => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal')
            .and.returnValue(Promise.resolve(list('list-1')));
        const changes = [{action: 'add' as const, contentId: 'article-1', position: 0}];

        saveItemChanges('list-1', '2024-05-01T00:00:00+0000', changes).then(() => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'PATCH',
                path: '/content_lists/list-1/items',
                payload: {updatedAt: '2024-05-01T00:00:00+0000', items: changes},
            });

            done();
        });
    });
});

describe('webhooks api', () => {
    it('fetchWebhooks requests all webhooks', (done) => {
        const httpSpy = respondWith([webhook('w1')]);

        fetchWebhooks().then((webhooks) => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'GET',
                path: '/content_list_webhooks',
                urlParams: {max_results: 200},
            });
            expect(webhooks.length).toBe(1);

            done();
        });
    });

    it('createWebhook posts the payload', (done) => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal')
            .and.returnValue(Promise.resolve(webhook('w1')));
        const payload = {url: 'https://example.com', enabled: true};

        createWebhook(payload).then(() => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'POST',
                path: '/content_list_webhooks',
                payload,
            });

            done();
        });
    });

    it('updateWebhook patches using the webhook etag', (done) => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestJsonLocal')
            .and.returnValue(Promise.resolve(webhook('w1')));

        updateWebhook(webhook('w1'), {enabled: false}).then(() => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'PATCH',
                path: '/content_list_webhooks/w1',
                payload: {enabled: false},
                headers: {'If-Match': 'etag-w1'},
            });

            done();
        });
    });

    it('deleteWebhook deletes using the webhook etag', (done) => {
        const httpSpy = spyOn(superdeskMock, 'httpRequestVoidLocal')
            .and.returnValue(Promise.resolve());

        deleteWebhook(webhook('w1')).then(() => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'DELETE',
                path: '/content_list_webhooks/w1',
                headers: {'If-Match': 'etag-w1'},
            });

            done();
        });
    });
});
