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

describe('compare-versions-dropdown directive', () => {
    let versions = [
        {_id: 1, _current_version: 1, _latest_version: 3, headline: 'headline v1'},
        {_id: 1, _current_version: 2, _latest_version: 3, headline: 'headline updated v2'},
        {_id: 1, _current_version: 3, _latest_version: 3, headline: 'headline updated v3'}
    ];

    beforeEach(window.module('superdesk.apps.authoring.compare_versions'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    it('can fetch versions and set current item version queued',
        inject((compareVersions, desks, archiveService, $rootScope, $compile, $q) => {
            spyOn(desks, 'initialize').and.returnValue($q.when());
            spyOn(archiveService, 'getVersions').and.returnValue($q.when(versions));

            let scope = $rootScope.$new();

            scope.item = versions[2];

            $compile('<ul sd-compare-versions-dropdown></ul>')(scope);
            scope.$digest();

            expect(desks.initialize).toHaveBeenCalled();
            expect(archiveService.getVersions).toHaveBeenCalledWith(scope.item, desks, 'versions');

            expect(compareVersions.versions).toBe(versions);
            expect(scope.items).toBe(versions);

            expect(scope.current.id).toBe(scope.item._id);
            expect(scope.current.version).toBe(scope.item._current_version);

            expect(scope.queue).toEqual([scope.current]);
        }));
});
