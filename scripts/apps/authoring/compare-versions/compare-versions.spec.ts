describe('compare versions', () => {
    beforeEach(window.module('superdesk.apps.authoring.compare_versions'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    it('can open an item', inject((compareVersions) => {
        let items = compareVersions.items;

        expect(items.length).toBe(0);
        compareVersions.edit({id: 1, version: 3}, 0);
        expect(compareVersions.items.length).toBe(1);
        expect(compareVersions.items).toEqual(items);
    }));

    it('can remove an item from a board', inject((compareVersions) => {
        compareVersions.edit({id: 1, version: 2}, 0);
        compareVersions.edit({id: 1, version: 1}, 1);
        let items = compareVersions.items;

        compareVersions.remove({id: 1, version: 2});
        expect(compareVersions.items.length).toBe(2);
        expect(compareVersions.items).toEqual(items);
    }));

    it('can remove board', inject((compareVersions) => {
        compareVersions.edit({id: 1, version: 3}, 0);
        compareVersions.edit({id: 1, version: 2}, 1);
        compareVersions.edit({id: 1, version: 1}, 2);
        compareVersions.close(1);
        expect(compareVersions.items.length).toBe(2);
    }));
});
