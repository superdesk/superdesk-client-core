import * as React from 'react';
import {DropResult} from 'react-beautiful-dnd';
import {IContentList, IContentListItem} from '../interfaces';
import {flushPromises, mountWithCleanup} from '../tests/helpers';
import {dispatchWebsocketEvent, superdeskMock} from '../tests/superdesk-mock';
import {ArticleRow} from './article-row';
import {ListEditor} from './list-editor';
import {ListPane} from './list-pane';
import {PickerPane} from './picker-pane';

const LIST: IContentList = {
    _id: 'list-1',
    _created: '2024-01-01T00:00:00+0000',
    _updated: '2024-01-01T00:00:00+0000',
    _etag: 'etag-list-1',
    _links: {},
    name: 'My list',
    type: 'manual',
    content_list_items_updated_at: '2024-05-01T00:00:00+0000',
};

function listItem(id: string, position: number): IContentListItem {
    return {
        _id: `item-${id}`,
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-01T00:00:00+0000',
        _etag: `etag-${id}`,
        _links: {},
        content: id,
        position,
        article_content: {title: `title ${id}`, state: 'published'},
    };
}

function searchResultArticle(id: string) {
    return {
        _id: id,
        guid: id,
        headline: `headline ${id}`,
        state: 'published',
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-01T00:00:00+0000',
    };
}

interface IHttpHandlers {
    // keyed by `${method} ${path}`
    [key: string]: (request: {payload?: unknown; urlParams?: {[key: string]: unknown}}) => unknown;
}

function stubHttp(extraHandlers: IHttpHandlers = {}): jasmine.Spy {
    const handlers: IHttpHandlers = {
        'GET /content_lists/list-1': () => LIST,
        'GET /content_lists/list-1/items': () => ({
            _items: [listItem('a', 0), listItem('b', 1), listItem('c', 2)],
            _meta: {total: 3},
        }),
        'GET /published': () => ({
            _items: [searchResultArticle('x'), searchResultArticle('y')],
            _meta: {total: 2},
        }),
        ...extraHandlers,
    };

    return spyOn(superdeskMock, 'httpRequestJsonLocal').and.callFake((request) => {
        const handler = handlers[`${request.method} ${request.path}`];

        if (handler == null) {
            return Promise.reject(new Error(`unexpected request: ${request.method} ${request.path}`));
        }

        return Promise.resolve(handler(request));
    });
}

interface IMounted {
    editor: ListEditor;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wrapper: any;
    onBack: jasmine.Spy;
    onOpenList: jasmine.Spy;
}

function mountEditor(): Promise<IMounted> {
    const onBack = jasmine.createSpy('onBack');
    const onOpenList = jasmine.createSpy('onOpenList');

    const wrapper = mountWithCleanup(
        <ListEditor
            listId="list-1"
            lists={[LIST]}
            onBack={onBack}
            onOpenList={onOpenList}
        />,
    );

    return flushPromises().then(() => {
        wrapper.update();

        return {
            editor: wrapper.find(ListEditor).instance() as ListEditor,
            wrapper,
            onBack,
            onOpenList,
        };
    });
}

function dragEnd(
    from: {droppableId: string; index: number},
    to: {droppableId: string; index: number} | null,
    draggableId: string,
): DropResult {
    return {
        source: from,
        destination: to,
        draggableId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
}

describe('ListEditor', () => {
    it('loads the list, its items and the article search results on mount', async () => {
        stubHttp();

        const {wrapper} = await mountEditor();

        expect(wrapper.find(ListPane).prop('entries').map(({contentId}: {contentId: string}) => contentId))
            .toEqual(['a', 'b', 'c']);
        expect(wrapper.find(PickerPane).prop('entries').map(({contentId}: {contentId: string}) => contentId))
            .toEqual(['x', 'y']);
        expect(wrapper.find(ArticleRow).length).toBe(5);
    });

    it('notifies and goes back when the list cannot be loaded', async () => {
        stubHttp({
            'GET /content_lists/list-1': () => Promise.reject(new Error('not found')),
        });

        const notifyErrorSpy = spyOn(superdeskMock, 'notifyError');
        const {onBack} = await mountEditor();

        expect(notifyErrorSpy).toHaveBeenCalledWith('Could not load the content list.');
        expect(onBack).toHaveBeenCalled();
    });

    it('dims picker results that are already in the list', async () => {
        stubHttp({
            'GET /published': () => ({
                _items: [searchResultArticle('a'), searchResultArticle('z')],
                _meta: {total: 2},
            }),
        });

        const {wrapper} = await mountEditor();

        expect(wrapper.find(PickerPane).prop('listContentIds')).toEqual(new Set(['a', 'b', 'c']));
    });

    it('records a move when an entry is reordered within the list', async () => {
        stubHttp();

        const {editor} = await mountEditor();

        editor.onDragEnd(dragEnd(
            {droppableId: 'contentList', index: 0},
            {droppableId: 'contentList', index: 2},
            'item-a',
        ));

        expect((editor.state.entries ?? []).map(({contentId}) => contentId)).toEqual(['b', 'c', 'a']);
        expect(editor.state.changesRecord).toEqual([{action: 'move', contentId: 'a', position: 2}]);
    });

    it('ignores drops outside a droppable and drops at the same position', async () => {
        stubHttp();

        const {editor} = await mountEditor();

        editor.onDragEnd(dragEnd({droppableId: 'contentList', index: 0}, null, 'item-a'));
        editor.onDragEnd(dragEnd(
            {droppableId: 'contentList', index: 1},
            {droppableId: 'contentList', index: 1},
            'item-b',
        ));

        expect(editor.state.changesRecord).toEqual([]);
        expect((editor.state.entries ?? []).map(({contentId}) => contentId)).toEqual(['a', 'b', 'c']);
    });

    it('records an add when an article is dragged in from the picker', async () => {
        stubHttp();

        const {editor} = await mountEditor();

        editor.onDragEnd(dragEnd({droppableId: 'articles', index: 0}, {droppableId: 'contentList', index: 1}, 'x'));

        expect((editor.state.entries ?? []).map(({contentId}) => contentId)).toEqual(['a', 'x', 'b', 'c']);
        expect((editor.state.entries ?? [])[1].uid).toBe('added-1');
        expect(editor.state.changesRecord).toEqual([{action: 'add', contentId: 'x', position: 1}]);

        // removed from the picker results
        expect(editor.state.articles.entries.map(({contentId}) => contentId)).toEqual(['y']);
    });

    it('keeps pinned entries in place when other entries move', async () => {
        stubHttp();

        const {editor} = await mountEditor();

        // pin "a" at position 0, then move "c" to the top
        editor.pinUnpin('item-a');
        editor.onDragEnd(dragEnd(
            {droppableId: 'contentList', index: 2},
            {droppableId: 'contentList', index: 0},
            'item-c',
        ));

        expect((editor.state.entries ?? []).map(({contentId}) => contentId)).toEqual(['a', 'c', 'b']);
    });

    it('records pinning as a sticky move', async () => {
        stubHttp();

        const {editor} = await mountEditor();

        editor.pinUnpin('item-b');

        const entries = editor.state.entries ?? [];

        expect(entries[1].sticky).toBe(true);
        expect(entries[1].stickyPosition).toBe(1);
        expect(editor.state.changesRecord).toEqual([
            {action: 'move', contentId: 'b', position: 1, sticky: true},
        ]);

        editor.pinUnpin('item-b');

        expect((editor.state.entries ?? [])[1].sticky).toBe(false);
        expect((editor.state.entries ?? [])[1].stickyPosition).toBe(null);
    });

    it('records a delete when an entry is removed', async () => {
        stubHttp();

        const {editor} = await mountEditor();

        editor.removeEntry('item-b');

        expect((editor.state.entries ?? []).map(({contentId}) => contentId)).toEqual(['a', 'c']);
        expect(editor.state.changesRecord).toEqual([{action: 'delete', contentId: 'b'}]);
    });

    it('cancels the pending add when a just-added entry is removed', async () => {
        stubHttp();

        const {editor} = await mountEditor();

        editor.onDragEnd(dragEnd({droppableId: 'articles', index: 0}, {droppableId: 'contentList', index: 0}, 'x'));
        editor.removeEntry('added-1');

        expect(editor.state.changesRecord).toEqual([]);
    });

    it('saves the change record and reloads the list', async () => {
        const httpSpy = stubHttp({
            'PATCH /content_lists/list-1/items': () => LIST,
        });
        const notifySuccessSpy = spyOn(superdeskMock, 'notifySuccess');

        const {editor} = await mountEditor();

        editor.removeEntry('item-b');
        editor.save();

        expect(editor.state.saving).toBe(true);

        await flushPromises();

        expect(httpSpy).toHaveBeenCalledWith({
            method: 'PATCH',
            path: '/content_lists/list-1/items',
            payload: {
                updatedAt: '2024-05-01T00:00:00+0000',
                items: [{action: 'delete', contentId: 'b'}],
            },
        });
        expect(notifySuccessSpy).toHaveBeenCalledWith('Content list saved.');
        expect(editor.state.saving).toBe(false);

        // reloaded from the server; the change record is reset
        expect(editor.state.changesRecord).toEqual([]);
        expect((editor.state.entries ?? []).length).toBe(3);
    });

    it('does nothing on save without changes', async () => {
        const httpSpy = stubHttp();

        const {editor} = await mountEditor();

        httpSpy.calls.reset();
        editor.save();

        expect(editor.state.saving).toBe(false);
        expect(httpSpy).not.toHaveBeenCalled();
    });

    it('notifies about a conflict and reloads when another user modified the list', async () => {
        stubHttp({
            // the real body the bulk items PATCH rejects with (no `_error` wrapper)
            'PATCH /content_lists/list-1/items': () => Promise.reject({
                _status: 'ERR',
                _message: 'Content list items have been modified',
                internal_error: 409,
            }),
        });
        const notifyErrorSpy = spyOn(superdeskMock, 'notifyError');

        const {editor} = await mountEditor();

        editor.removeEntry('item-b');
        editor.save();

        await flushPromises();

        expect(notifyErrorSpy).toHaveBeenCalledWith('Cannot save. The list has been modified by another user.');

        // reloaded; local changes were discarded
        expect(editor.state.changesRecord).toEqual([]);
        expect((editor.state.entries ?? []).length).toBe(3);
    });

    it('notifies about other save errors and keeps the changes', async () => {
        stubHttp({
            'PATCH /content_lists/list-1/items': () => Promise.reject(new Error('server error')),
        });
        const notifyErrorSpy = spyOn(superdeskMock, 'notifyError');

        const {editor} = await mountEditor();

        editor.removeEntry('item-b');
        editor.save();

        await flushPromises();

        expect(notifyErrorSpy).toHaveBeenCalledWith('Could not save the content list.');
        expect(editor.state.saving).toBe(false);
        expect(editor.state.changesRecord).toEqual([{action: 'delete', contentId: 'b'}]);
    });

    it('asks for confirmation before navigating away with unsaved changes', async () => {
        stubHttp();

        const confirmSpy = spyOn(superdeskMock, 'confirm').and.returnValue(Promise.resolve(false));

        const {editor, wrapper, onBack} = await mountEditor();

        editor.removeEntry('item-b');
        wrapper.update();

        (wrapper.find(ListPane).prop('onBack') as () => void)();
        await flushPromises();

        expect(confirmSpy).toHaveBeenCalled();
        expect(onBack).not.toHaveBeenCalled();

        confirmSpy.and.returnValue(Promise.resolve(true));

        (wrapper.find(ListPane).prop('onBack') as () => void)();
        await flushPromises();

        expect(onBack).toHaveBeenCalled();
    });

    it('navigates without confirmation when there are no unsaved changes', async () => {
        stubHttp();

        const confirmSpy = spyOn(superdeskMock, 'confirm');

        const {wrapper, onOpenList} = await mountEditor();

        (wrapper.find(ListPane).prop('onOpenList') as (listId: string) => void)('list-2');
        await flushPromises();

        expect(confirmSpy).not.toHaveBeenCalled();
        expect(onOpenList).toHaveBeenCalledWith('list-2');
    });

    it('reloads from the server on websocket item updates unless there are unsaved changes', async () => {
        const httpSpy = stubHttp();

        const {editor} = await mountEditor();

        jasmine.clock().install();
        jasmine.clock().mockDate();

        try {
            httpSpy.calls.reset();
            dispatchWebsocketEvent('content_list:items_updated', {list_id: 'list-1'});
            jasmine.clock().tick(1001);

            expect(httpSpy.calls.allArgs().map(([request]) => request.path))
                .toContain('/content_lists/list-1');

            // with unsaved changes the refresh is skipped
            editor.removeEntry('item-b');
            httpSpy.calls.reset();
            dispatchWebsocketEvent('content_list:items_updated', {list_id: 'list-1'});
            jasmine.clock().tick(1001);

            expect(httpSpy).not.toHaveBeenCalled();
        } finally {
            jasmine.clock().uninstall();
        }
    });
});
