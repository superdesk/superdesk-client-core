import {IArticle, IPackageItem, IPackageItemsValueOperational} from 'superdesk-api';
import {addItemsToGroup, getPackageItemRef, isInPackage, moveItem, removeItem, setItemLabel} from './package-groups';

function ref(id: string): IPackageItem {
    return {
        residRef: id,
        type: 'text',
        headline: '',
        slugline: id,
        location: 'archive',
        renditions: {},
        itemClass: 'icls:text',
    };
}

function article(id: string, extra?: Partial<IArticle>): IArticle {
    return {_id: id, type: 'text', slugline: id, ...(extra ?? {})} as IArticle;
}

const groups: IPackageItemsValueOperational = [
    {id: 'main', label: 'main', refs: [ref('a'), ref('b'), ref('c')]},
    {id: 'story', refs: [ref('d')]},
    {id: 'sidebars', refs: []},
];

function ids(value: IPackageItemsValueOperational): Array<Array<string>> {
    return value.map((group) => group.refs.map(({residRef}) => residRef));
}

describe('package groups', () => {
    describe('getPackageItemRef', () => {
        it('points to the archive item', () => {
            expect(getPackageItemRef(article('a', {_type: 'archive'}))).toEqual(jasmine.objectContaining({
                residRef: 'a',
                location: 'archive',
                itemClass: 'icls:text',
            }));
        });

        it('points to the archive item for a published search result', () => {
            expect(getPackageItemRef(article('p', {_type: 'published', item_id: 'a'}))).toEqual(
                jasmine.objectContaining({residRef: 'a', location: 'archive'}),
            );
        });
    });

    describe('addItemsToGroup', () => {
        it('puts each item in front of the group, one by one', () => {
            const result = addItemsToGroup(groups, 'story', [article('x'), article('y')]);

            expect(ids(result.groups)).toEqual([['a', 'b', 'c'], ['y', 'x', 'd'], []]);
            expect(result.duplicates).toEqual([]);
        });

        it('skips and reports items that are in any group already', () => {
            const result = addItemsToGroup(groups, 'main', [article('d'), article('x')]);

            expect(ids(result.groups)).toEqual([['x', 'a', 'b', 'c'], ['d'], []]);
            expect(result.duplicates.map(({_id}) => _id)).toEqual(['d']);
        });

        it('skips and reports ingest items, which have to be fetched first', () => {
            const result = addItemsToGroup(groups, 'main', [article('i', {_type: 'ingest'}), article('x')]);

            expect(ids(result.groups)).toEqual([['x', 'a', 'b', 'c'], ['d'], []]);
            expect(result.notFetched.map(({_id}) => _id)).toEqual(['i']);
        });

        it('returns the same groups when every item is a duplicate', () => {
            expect(addItemsToGroup(groups, 'main', [article('a')]).groups).toBe(groups);
        });

        it('adds a group the package does not have yet at the end', () => {
            const result = addItemsToGroup(groups, 'fact box', [article('x')]);

            expect(result.groups[3]).toEqual({id: 'fact box', refs: [jasmine.objectContaining({residRef: 'x'})]});
        });
    });

    describe('moveItem', () => {
        it('reorders within a group', () => {
            expect(ids(moveItem(groups, {groupId: 'main', index: 0}, {groupId: 'main', index: 2}))).toEqual(
                [['b', 'c', 'a'], ['d'], []],
            );
        });

        it('moves to another group', () => {
            expect(ids(moveItem(groups, {groupId: 'main', index: 1}, {groupId: 'story', index: 1}))).toEqual(
                [['a', 'c'], ['d', 'b'], []],
            );
        });

        it('moves to an empty group', () => {
            expect(ids(moveItem(groups, {groupId: 'story', index: 0}, {groupId: 'sidebars', index: 0}))).toEqual(
                [['a', 'b', 'c'], [], ['d']],
            );
        });

        it('keeps the ref as it is', () => {
            const moved = moveItem(groups, {groupId: 'story', index: 0}, {groupId: 'main', index: 0});

            expect(moved[0].refs[0]).toBe(groups[1].refs[0]);
        });

        it('returns the same groups when nothing moves', () => {
            expect(moveItem(groups, {groupId: 'main', index: 1}, {groupId: 'main', index: 1})).toBe(groups);
        });
    });

    it('removes an item from its group only', () => {
        expect(ids(removeItem(groups, 'main', 'b'))).toEqual([['a', 'c'], ['d'], []]);
    });

    it('sets and clears the label of an item', () => {
        const labelled = setItemLabel(groups, 'd', 'breaking');

        expect(labelled[1].refs[0].label).toBe('breaking');
        expect(labelled[0]).toBe(groups[0]);
        expect(setItemLabel(labelled, 'd', null)[1].refs[0].label).toBe(null);
    });

    it('tells whether an item is in the package', () => {
        expect(isInPackage(groups, article('d'))).toBe(true);
        expect(isInPackage(groups, article('x'))).toBe(false);
        expect(isInPackage(groups, article('p', {_type: 'published', item_id: 'a'}))).toBe(true);
    });
});
