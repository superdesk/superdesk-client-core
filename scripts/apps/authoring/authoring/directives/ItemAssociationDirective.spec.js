
describe('item association directive', function() {
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.templates-cache'));

    var elem, scope, item = {};

    beforeEach(inject(function($compile, $rootScope) {
        scope = $rootScope.$new();
        scope.rel = 'featured';
        scope.item = item;
        elem = $compile(`<div sd-item-association
            data-item="item"
            data-rel="rel"
            data-onchange="onChange()"></div>`
        )(scope);
        $rootScope.$digest();
    }));

    it('can trigger onchange handler on drop', inject(function($rootScope) {
        var event = new window.$.Event('drop');
        event.originalEvent = {dataTransfer: {
            types: [{type: 'video'}],
            getData: () => angular.toJson({headline: 'foo'})
        }};
        event.preventDefault = jasmine.createSpy('preventDefault');
        event.stopPropagation = jasmine.createSpy('stopPropagation');
        scope.onChange = jasmine.createSpy('onchange');
        elem.triggerHandler(event);
        $rootScope.$digest();
        expect(scope.onChange).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(scope.item.associations.featured.headline).toBe('foo');
    }));
});
