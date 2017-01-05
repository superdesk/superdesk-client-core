
describe('item association directive', () => {
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    var elem, scope, item = {associations: {}};

    beforeEach(inject(($compile, $rootScope) => {
        scope = $rootScope.$new();
        scope.rel = 'featured';
        scope.item = item;
        elem = $compile(`<div sd-item-association
            data-item="item"
            data-rel="rel"
            data-onchange="onChange()"
            data-save="save()"></div>`
        )(scope);
        $rootScope.$digest();
    }));

    it('can trigger onsave handler on drop when content is not published', inject(($rootScope) => {
        var event = new window.$.Event('drop');

        event.originalEvent = {dataTransfer: {
            types: [{type: 'video'}],
            getData: () => angular.toJson({headline: 'foo', _type: 'externalsource'})
        }};
        event.preventDefault = jasmine.createSpy('preventDefault');
        event.stopPropagation = jasmine.createSpy('stopPropagation');
        scope.editable = true;
        scope.onChange = jasmine.createSpy('onchange');
        scope.save = jasmine.createSpy('save');
        elem.triggerHandler(event);
        $rootScope.$digest();
        expect(scope.onChange).not.toHaveBeenCalled();
        expect(scope.save).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(scope.item.associations.featured.headline).toBe('foo');
    }));

    it('can trigger onchange handler on drop when content is published', inject(($rootScope) => {
        var event = new window.$.Event('drop');

        scope.item.state = 'published';
        event.originalEvent = {dataTransfer: {
            types: [{type: 'video'}],
            getData: () => angular.toJson({headline: 'foo', _type: 'externalsource'})
        }};
        event.preventDefault = jasmine.createSpy('preventDefault');
        event.stopPropagation = jasmine.createSpy('stopPropagation');
        scope.editable = true;
        scope.onChange = jasmine.createSpy('onchange');
        scope.save = jasmine.createSpy('save');
        elem.triggerHandler(event);
        $rootScope.$digest();
        expect(scope.onChange).toHaveBeenCalled();
        expect(scope.save).not.toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(scope.item.associations.featured.headline).toBe('foo');
    }));
});
