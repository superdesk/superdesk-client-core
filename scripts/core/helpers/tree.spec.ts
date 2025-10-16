import {arrayToTree, filterFlatTree, getTreeLeafs} from './tree';

describe('filterFlatTree', () => {
    const flatTree = [
        {id: '1', parent: null},
        {id: '1.1', parent: '1'},

        {id: '1.2', parent: '1'},
        {id: '1.2.1', parent: '1.2'},
        {id: '1.2.2', parent: '1.2'},
        {id: '1.2.3', parent: '1.2'},

        {id: '1.3', parent: '1'},
        {id: '1.3.1', parent: '1.3'},
        {id: '1.3.2', parent: '1.3'},

        {id: '2', parent: null},
        {id: '3', parent: null},
    ];

    it('always includes children', () => {
        const toInclude = new Set(['1.2', '2']);

        const result = filterFlatTree({
            itemsFlat: flatTree,
            filterFn: (item) => toInclude.has(item.id),
            getId: (item) => item.id,
            getParentId: (item) => item.parent,
            includeParents: false,
        });

        expect(result.map(({id}) => id).join(' > '))
            .toBe(['1.2', '1.2.1', '1.2.2', '1.2.3', '2'].join(' > '));
    });

    it('can include parents if configured', () => {
        const toInclude = new Set(['1.2.3', '2']);

        const result = filterFlatTree({
            itemsFlat: flatTree,
            filterFn: (item) => toInclude.has(item.id),
            getId: (item) => item.id,
            getParentId: (item) => item.parent,
            includeParents: true,
        });

        expect(result.map(({id}) => id).join(' > '))
            .toBe(['1', '1.2', '1.2.3', '2'].join(' > '));
    });
});


it('can get tree leafs', () => {
    const flatTree = [
        {id: '1', parent: null},
        {id: '1.1', parent: '1'},

        {id: '1.2', parent: '1'},
        {id: '1.2.1', parent: '1.2'},
        {id: '1.2.2', parent: '1.2'},
        {id: '1.2.3', parent: '1.2'},

        {id: '1.3', parent: '1'},
        {id: '1.3.1', parent: '1.3'},
        {id: '1.3.2', parent: '1.3'},

        {id: '2', parent: null},
        {id: '3', parent: null},
    ];

    const tree = arrayToTree(
        flatTree,
        ({id}) => id,
        ({parent}) => parent,
    ).result;

    expect(
        getTreeLeafs(tree).map((item) => item.value.id),
    ).toEqual(['1.1', '1.2.1', '1.2.2', '1.2.3', '1.3.1', '1.3.2', '2', '3']);
});
