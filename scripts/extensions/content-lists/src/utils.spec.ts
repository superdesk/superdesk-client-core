import {IContentListItem, IItemChange, IListEntry} from './interfaces';
import {
    fixPinnedItemsPosition,
    formatArticleTime,
    getDuplicateContentIds,
    listItemToEntry,
    moveBetween,
    recordChange,
    reorder,
    updatePositions,
} from './utils';

function entry(contentId: string, overrides: Partial<IListEntry> = {}): IListEntry {
    return {
        uid: contentId,
        contentId,
        title: contentId,
        state: 'published',
        category: null,
        updated: null,
        created: null,
        publishSchedule: null,
        thumbnailUrl: null,
        sticky: false,
        stickyPosition: null,
        dangling: false,
        ...overrides,
    };
}

describe('reorder', () => {
    it('moves an item to the target index without mutating the input', () => {
        const input = ['a', 'b', 'c', 'd'];

        expect(reorder(input, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
        expect(reorder(input, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
        expect(input).toEqual(['a', 'b', 'c', 'd']);
    });
});

describe('moveBetween', () => {
    it('moves an item from one list to another without mutating the inputs', () => {
        const source = ['a', 'b'];
        const destination = ['c', 'd'];

        expect(moveBetween(source, destination, 0, 1)).toEqual({
            source: ['b'],
            destination: ['c', 'a', 'd'],
        });
        expect(source).toEqual(['a', 'b']);
        expect(destination).toEqual(['c', 'd']);
    });
});

describe('fixPinnedItemsPosition', () => {
    it('moves a pinned entry back to its recorded position', () => {
        const result = fixPinnedItemsPosition([
            entry('b'),
            entry('a', {sticky: true, stickyPosition: 0}),
            entry('c'),
        ]);

        expect(result.map(({contentId}) => contentId)).toEqual(['a', 'b', 'c']);
    });

    it('keeps entries in place when pinned entries are already positioned correctly', () => {
        const entries = [
            entry('a', {sticky: true, stickyPosition: 0}),
            entry('b'),
            entry('c', {sticky: true, stickyPosition: 2}),
        ];

        expect(fixPinnedItemsPosition(entries)).toEqual(entries);
    });

    it('ignores sticky entries without a recorded position', () => {
        const entries = [
            entry('b'),
            entry('a', {sticky: true, stickyPosition: null}),
        ];

        expect(fixPinnedItemsPosition(entries)).toEqual(entries);
    });
});

describe('recordChange', () => {
    it('appends a delete for an entry that exists on the server', () => {
        expect(recordChange([], 'delete', 'a', []))
            .toEqual([{action: 'delete', contentId: 'a'}]);
    });

    it('appends an add with the position taken from current entries', () => {
        expect(recordChange([], 'add', 'a', [entry('b'), entry('a')]))
            .toEqual([{action: 'add', contentId: 'a', position: 1}]);
    });

    it('records the sticky flag when provided', () => {
        expect(recordChange([], 'move', 'a', [entry('a')], true))
            .toEqual([{action: 'move', contentId: 'a', position: 0, sticky: true}]);
    });

    it('cancels a pending add when the added entry is removed again', () => {
        const changes: Array<IItemChange> = [{action: 'add', contentId: 'a', position: 0}];

        expect(recordChange(changes, 'delete', 'a', [])).toEqual([]);
    });

    it('cancels follow-up moves of the pending add as well', () => {
        const changes: Array<IItemChange> = [
            {action: 'add', contentId: 'a', position: 0},
            {action: 'move', contentId: 'b', position: 1},
            {action: 'move', contentId: 'a', position: 2},
        ];

        expect(recordChange(changes, 'delete', 'a', [entry('b')]))
            .toEqual([{action: 'move', contentId: 'b', position: 0}]);
    });

    it('keeps an earlier delete when a re-added entry is removed again', () => {
        // server has "a"; user deleted it, re-added it, then removed the
        // re-added row: the original delete must survive
        const changes: Array<IItemChange> = [
            {action: 'delete', contentId: 'a'},
            {action: 'add', contentId: 'a', position: 0},
        ];

        expect(recordChange(changes, 'delete', 'a', []))
            .toEqual([{action: 'delete', contentId: 'a'}]);
    });

    it('rewrites positions of remaining changes from current entries', () => {
        const changes: Array<IItemChange> = [
            {action: 'add', contentId: 'a', position: 0},
            {action: 'add', contentId: 'c', position: 2},
        ];

        expect(recordChange(changes, 'delete', 'a', [entry('b'), entry('c')]))
            .toEqual([{action: 'add', contentId: 'c', position: 1}]);
    });
});

describe('updatePositions', () => {
    it('rewrites positions of non-delete changes and leaves deletes untouched', () => {
        const changes: Array<IItemChange> = [
            {action: 'add', contentId: 'a', position: 0},
            {action: 'delete', contentId: 'b'},
            {action: 'move', contentId: 'c', position: 5},
        ];

        expect(updatePositions(changes, [entry('c'), entry('a')])).toEqual([
            {action: 'add', contentId: 'a', position: 1},
            {action: 'delete', contentId: 'b'},
            {action: 'move', contentId: 'c', position: 0},
        ]);
    });
});

describe('getDuplicateContentIds', () => {
    it('returns the contentIds that appear more than once', () => {
        const duplicates = getDuplicateContentIds([
            entry('a'),
            entry('b'),
            entry('a', {uid: 'a-2'}),
            entry('c'),
            entry('c', {uid: 'c-2'}),
        ]);

        expect(Array.from(duplicates).sort()).toEqual(['a', 'c']);
    });

    it('returns an empty set when there are no duplicates', () => {
        expect(getDuplicateContentIds([entry('a'), entry('b')]).size).toBe(0);
    });
});

describe('formatArticleTime', () => {
    it('returns an empty string for missing or invalid dates', () => {
        expect(formatArticleTime(null)).toBe('');
        expect(formatArticleTime('')).toBe('');
        expect(formatArticleTime('not-a-date')).toBe('');
    });

    it('formats today\'s dates as time only', () => {
        const date = new Date();

        date.setHours(9, 5, 0, 0);

        expect(formatArticleTime(date.toISOString())).toBe('09:05');
    });

    it('formats other dates as time and date', () => {
        // no timezone designator - parsed as local time
        expect(formatArticleTime('2020-01-02T03:04:00')).toBe('03:04, 02.01.2020');
    });
});

describe('listItemToEntry', () => {
    const baseItem: IContentListItem = {
        _id: 'item-1',
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-02T00:00:00+0000',
        _etag: 'etag',
        _links: {},
        content: 'article-1',
        position: 3,
        article_content: {
            title: 'Article title',
            state: 'published',
            anpa_category: [{name: 'News', qcode: 'n'}],
            _created: '2024-02-01T00:00:00+0000',
            _updated: '2024-02-02T00:00:00+0000',
        },
    };

    it('maps a list item to a list entry', () => {
        expect(listItemToEntry(baseItem)).toEqual({
            uid: 'item-1',
            contentId: 'article-1',
            title: 'Article title',
            state: 'published',
            category: 'News',
            updated: '2024-02-02T00:00:00+0000',
            created: '2024-02-01T00:00:00+0000',
            publishSchedule: null,
            thumbnailUrl: null,
            sticky: false,
            stickyPosition: null,
            dangling: false,
        });
    });

    it('marks entries with unresolvable articles as dangling and falls back to item dates', () => {
        const result = listItemToEntry({...baseItem, article_content: null});

        expect(result.dangling).toBe(true);
        expect(result.title).toBe('');
        expect(result.state).toBe('');
        expect(result.category).toBe(null);
        expect(result.updated).toBe('2024-01-02T00:00:00+0000');
        expect(result.created).toBe('2024-01-01T00:00:00+0000');
    });

    it('records the sticky position only for sticky items', () => {
        expect(listItemToEntry({...baseItem, sticky: true}).stickyPosition).toBe(3);
        expect(listItemToEntry({...baseItem, sticky: false}).stickyPosition).toBe(null);
    });

    it('reads the thumbnail from a string or an object with href', () => {
        const withThumbnail = (thumbnail: string | {href: string}) => ({
            ...baseItem,
            article_content: {
                ...(baseItem.article_content ?? {title: '', state: ''}),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                thumbnail: thumbnail as any,
            },
        });

        expect(listItemToEntry(withThumbnail('https://example.com/thumb.jpg')).thumbnailUrl)
            .toBe('https://example.com/thumb.jpg');
        expect(listItemToEntry(withThumbnail({href: 'https://example.com/href.jpg'})).thumbnailUrl)
            .toBe('https://example.com/href.jpg');
        expect(listItemToEntry(baseItem).thumbnailUrl).toBe(null);
    });

    it('falls back to the content id when the item has no _id yet', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(listItemToEntry({...baseItem, _id: undefined as any}).uid).toBe('article-1');
    });
});
