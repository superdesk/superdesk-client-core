
describe('related item widget', () => {
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.apps.dashboard.widgets.relatedItem'));
    beforeEach(window.module('superdesk.apps.extension-points'));

    it('can open item', inject(($rootScope, $controller, superdesk) => {
        var scope = $rootScope.$new();

        scope.item = {event_id: 1};
        $controller('relatedItemController', {$scope: scope});
        scope.$digest();

        var item = {};

        spyOn(superdesk, 'intent');
        scope.actions.open.method(item);
        expect(superdesk.intent).toHaveBeenCalledWith('edit', 'item', item);
    }));

    it('can associate item', inject(($rootScope, api, $q, $controller, superdesk) => {
        var scope = $rootScope.$new();

        scope.item = {event_id: 1};
        scope.options = {};
        $controller('relatedItemController', {$scope: scope});
        scope.$digest();

        var item = {priority: 1};

        spyOn(superdesk, 'intent');
        spyOn(api, 'save').and.returnValue($q.when({_items: [item]}));
        scope.options.item = {};
        scope.actions.apply.method(item);

        $rootScope.$apply();
        expect(scope.options.item.priority).toBe(1);
    }));
});
