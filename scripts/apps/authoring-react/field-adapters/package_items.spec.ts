import {cloneDeep} from 'lodash';
import {IArticle, IPackageItem, IPackageItemsValueOperational} from 'superdesk-api';
import {testArticle} from 'test-data/test-article';
import {getPackageGroups, package_items, setPackageGroups} from './package_items';

function ref(id: string, extra?: Partial<IPackageItem>): IPackageItem {
    return {
        residRef: id,
        guid: id,
        type: 'text',
        headline: `headline ${id}`,
        slugline: `slugline ${id}`,
        location: 'archive',
        renditions: {},
        itemClass: 'icls:text',
        ...(extra ?? {}),
    };
}

function getPackage(groups: Array<any> | undefined): IArticle {
    return {...testArticle, type: 'composite', groups} as IArticle;
}

function getMultiGroupPackage(): IArticle {
    return getPackage([
        {
            id: 'root',
            role: 'grpRole:NEP',
            refs: [{idRef: 'main', label: 'main'}, {idRef: 'story', label: 'Story'}],
        },
        {id: 'main', role: 'grpRole:main', refs: [ref('a'), ref('b')]},
        {id: 'story', refs: [ref('c', {label: 'breaking'})]}, // no `role`, like `package2` in the legacy snapshot
    ]);
}

describe('package_items adapter', () => {
    it('reads every group referenced from the root, in root order', () => {
        const value = package_items.retrieveStoredValue(getMultiGroupPackage(), null as any, {});

        expect(value).toEqual([
            {id: 'main', label: 'main', refs: [ref('a'), ref('b')]},
            {id: 'story', label: 'Story', refs: [ref('c', {label: 'breaking'})]},
        ]);
    });

    it('keeps the other groups when one group changes', () => {
        const item = getMultiGroupPackage();
        const original = cloneDeep(item);
        const value = getPackageGroups(item);

        const changed: IPackageItemsValueOperational = [
            {...value[0], refs: [value[0].refs[1]]},
            value[1],
        ];

        const result = package_items.storeValue(changed, item, {}, false);

        expect(result.groups).toEqual([
            {
                id: 'root',
                role: 'grpRole:NEP',
                refs: [{idRef: 'main', label: 'main'}, {idRef: 'story', label: 'Story'}],
            },
            {id: 'main', role: 'grpRole:main', refs: [ref('b')]},
            {id: 'story', refs: [ref('c', {label: 'breaking'})]},
        ]);
        expect(item).toEqual(original);
    });

    it('returns an untouched package as it is', () => {
        const item = getMultiGroupPackage();
        const value = package_items.retrieveStoredValue(item, null as any, {});

        expect(package_items.storeValue(value, item, {}, false)).toBe(item);
    });

    it('writes groups equal to the stored ones when a change is undone', () => {
        const item = getMultiGroupPackage();
        const value = getPackageGroups(item);
        const reordered = setPackageGroups(item, [{...value[0], refs: [...value[0].refs].reverse()}, value[1]]);

        const restored = setPackageGroups(reordered, getPackageGroups(item));

        expect(restored.groups).toEqual(item.groups);
    });

    it('reads and writes an empty package', () => {
        const item = getPackage([
            {id: 'root', role: 'grpRole:NEP', refs: [{idRef: 'main', label: 'main'}]},
            {id: 'main', role: 'grpRole:main', refs: []},
        ]);

        const value = getPackageGroups(item);

        expect(value).toEqual([{id: 'main', label: 'main', refs: []}]);
        expect(setPackageGroups(item, value)).toBe(item);
        expect(setPackageGroups(item, [{...value[0], refs: [ref('a')]}]).groups[1]).toEqual(
            {id: 'main', role: 'grpRole:main', refs: [ref('a')]},
        );
    });

    it('handles a root group that is not first', () => {
        const item = getPackage([
            {id: 'story', role: 'grpRole:story', refs: [ref('c')]},
            {id: 'root', role: 'grpRole:NEP', refs: [{idRef: 'main'}, {idRef: 'story'}]},
            {id: 'main', role: 'grpRole:main', refs: [ref('a')]},
        ]);

        const value = getPackageGroups(item);

        expect(value.map(({id}) => id)).toEqual(['main', 'story']);

        const result = setPackageGroups(item, [value[0], {...value[1], refs: []}]);

        expect(result.groups.map(({id}) => id)).toEqual(['story', 'root', 'main']);
        expect(result.groups[0].refs).toEqual([]);
        expect(result.groups[2].refs).toEqual([ref('a')]);
    });

    it('handles a package without groups', () => {
        const item = getPackage(undefined);

        expect(getPackageGroups(item)).toEqual([]);
        expect(setPackageGroups(item, [])).toBe(item);
        expect(setPackageGroups(item, [{id: 'main', refs: [ref('a')]}]).groups).toEqual([
            {id: 'root', role: 'grpRole:NEP', refs: [{idRef: 'main'}]},
            {id: 'main', role: 'grpRole:main', refs: [ref('a')]},
        ]);
    });

    it('reads a group the root points to but which is missing as empty', () => {
        const item = getPackage([
            {id: 'root', role: 'grpRole:NEP', refs: [{idRef: 'main'}, {idRef: 'story'}]},
            {id: 'main', role: 'grpRole:main', refs: [ref('a')]},
        ]);

        const value = getPackageGroups(item);

        expect(value[1]).toEqual({id: 'story', label: undefined, refs: []});

        const result = setPackageGroups(item, [value[0], {...value[1], refs: [ref('c')]}]);

        expect(result.groups[2]).toEqual({id: 'story', role: 'grpRole:story', refs: [ref('c')]});
    });

    it('adds a group that is new to the package to the root', () => {
        const item = getMultiGroupPackage();
        const value = getPackageGroups(item);

        const result = setPackageGroups(item, [...value, {id: 'sidebars', refs: [ref('d')]}]);

        expect(result.groups[0].refs).toEqual([
            {idRef: 'main', label: 'main'},
            {idRef: 'story', label: 'Story'},
            {idRef: 'sidebars'},
        ]);
        expect(result.groups[3]).toEqual({id: 'sidebars', role: 'grpRole:sidebars', refs: [ref('d')]});
    });
});
