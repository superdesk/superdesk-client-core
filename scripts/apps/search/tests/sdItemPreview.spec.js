
describe('sdItemPreview directive', () => {
    let scope, elem, iscope;
    let archiveItem = {_id: '1', family_id: '1', _type: 'archive'};
    let ingestItem = {_id: 'a', _type: 'ingest'};
    let relatedItems = {_items: []};
    let relatedItemEntries = [{_id: '2', family_id: '1'}];

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.core.privileges'));
    beforeEach(window.module('superdesk.apps.archive'));
    beforeEach(window.module('superdesk.apps.vocabularies'));


    beforeEach(inject(($rootScope, $compile) => {
        let html = '<div sd-item-preview data-item="item" data-close="" data-show-history-tab="true"></div>';

        scope = $rootScope.$new();

        elem = $compile(html)(scope);
        scope.$digest();
        iscope = elem.isolateScope();
    }));

    beforeEach(inject((familyService, $q) => {
        spyOn(familyService, 'fetchItems').and.returnValue($q.when(relatedItems));
    }));

    it('defaults to `content` tab', () => {
        expect(iscope.vm.current_tab).toBe('content');
    });

    it('can set item', () => {
        relatedItems._items = [];
        expect(iscope.item).not.toBeDefined();

        scope.item = archiveItem;
        scope.$apply();

        expect(iscope.item).toBe(scope.item);
    });

    it('can get related items', inject((familyService) => {
        relatedItems._items = relatedItemEntries;
        scope.item = archiveItem;
        scope.$apply();

        expect(familyService.fetchItems).toHaveBeenCalledWith(scope.item.family_id, scope.item);
        expect(iscope.relatedItems).toBe(relatedItems);
    }));

    it('can only get related items for archive and archived types', () => {
        relatedItems._items = relatedItemEntries;
        scope.item = archiveItem;
        scope.$apply();
        expect(iscope.relatedItems).toBe(relatedItems);

        scope.item = ingestItem;
        scope.$apply();
        expect(iscope.relatedItems).toBeNull();
    });

    it('can hide duplicates tab when item has no related items', () => {
        relatedItems._items = [];
        scope.item = archiveItem;
        scope.$apply();

        expect(iscope.showRelatedTab).toBeFalsy();
    });

    it('can show duplicates tab when item has related items', () => {
        relatedItems._items = relatedItemEntries;
        scope.item = archiveItem;
        scope.$apply();

        expect(iscope.showRelatedTab).toBeTruthy();
    });

    it('can move to content from duplicates tab if new item has no related items', () => {
        relatedItems._items = [];
        scope.item = archiveItem;
        iscope.vm.current_tab = 'related';
        scope.$apply();

        expect(iscope.vm.current_tab).toBe('content');
    });

    it('can fetch related items when item is duplicated', inject((familyService) => {
        relatedItems._items = [];
        scope.item = archiveItem;
        scope.$apply();

        relatedItems._items = relatedItemEntries;
        scope.$broadcast('item:duplicate');
        scope.$apply();

        expect(familyService.fetchItems).toHaveBeenCalledWith(scope.item.family_id, scope.item);
        expect(iscope.relatedItems).toBe(relatedItems);
    }));

    it('can re-fetch relatedItems when navigating to the duplicates tab', () => {
        let newRelatedItemEntries = [{_id: '2', family_id: '1'}, {_id: '3', family_id: '1'}];

        relatedItems._items = relatedItemEntries;
        scope.item = archiveItem;
        scope.$apply();
        expect(iscope.relatedItems).toBe(relatedItems);

        relatedItems._items = newRelatedItemEntries;
        iscope.vm.current_tab = 'related';
        scope.$apply();
        expect(iscope.relatedItems).toBe(relatedItems);
    });

    it('can close on events when items match', () => {
        spyOn(iscope, 'close').and.returnValue(null);
        iscope.item = archiveItem;

        scope.$broadcast('item:deleted', {item: archiveItem._id});
        scope.$apply();

        scope.$broadcast('item:unlink', {item: archiveItem._id});
        scope.$apply();

        scope.$broadcast('item:spike', {item: archiveItem._id});
        scope.$apply();

        scope.$broadcast('item:unspike', {item: archiveItem._id});
        scope.$apply();

        scope.$broadcast('item:move', {item: archiveItem._id});
        scope.$apply();

        scope.$broadcast('content:update', {items: {1: archiveItem}});
        scope.$apply();

        expect(iscope.close).toHaveBeenCalledTimes(6);
    });

    it('can not close on events when items don\'t match', () => {
        spyOn(iscope, 'close').and.returnValue(null);
        iscope.item = archiveItem;

        scope.$broadcast('item:deleted', {item: '3'});
        scope.$apply();

        scope.$broadcast('item:unlink', {item: '3'});
        scope.$apply();

        scope.$broadcast('item:spike', {item: '3'});
        scope.$apply();

        scope.$broadcast('item:unspike', {item: '3'});
        scope.$apply();

        scope.$broadcast('item:move', {item: '3'});
        scope.$apply();

        scope.$broadcast('content:update', {items: {3: {}}});
        scope.$apply();

        expect(iscope.close).toHaveBeenCalledTimes(0);
    });
});
