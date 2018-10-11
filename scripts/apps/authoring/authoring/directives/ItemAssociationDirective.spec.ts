
describe('item association directive', () => {
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    var elem, scope, item = {associations: {}};

    beforeEach(inject(($compile, $rootScope, config, renditions, $q) => {
        scope = $rootScope.$new();
        scope.rel = 'featured';
        scope.item = item;
        scope.editable = true;
        config.features = {
            editFeaturedImage: 1,
        };

        spyOn(renditions, 'ingest').and.returnValue($q.when({headline: 'foo',
            _type: 'externalsource',
            renditions: {
                original: {
                    mimetype: 'image/jpeg',
                },
            },
        }));

        spyOn(renditions, 'crop').and.returnValue($q.when({headline: 'foo',
            _type: 'externalsource',
            renditions: {
                original: {
                    mimetype: 'image/jpeg',
                },
            },
        }));

        elem = $compile(`<div sd-item-association
            data-item="item"
            data-rel="rel"
            data-editable="editable"
            data-onchange="onChange()"
            data-save="save()"></div>`,
        )(scope);
        $rootScope.$digest();
    }));

    it('can trigger onsave handler on drop when content is not published', inject(($rootScope, renditions) => {
        var event = new window.$.Event('drop');

        scope.item.state = 'in_progress';
        event.originalEvent = {dataTransfer: {
            types: ['video'],
            getData: () => angular.toJson({headline: 'foo', _type: 'externalsource'}),
        }};

        event.preventDefault = jasmine.createSpy('preventDefault');
        event.stopPropagation = jasmine.createSpy('stopPropagation');
        scope.onChange = jasmine.createSpy('onchange');
        scope.save = jasmine.createSpy('save');
        elem.triggerHandler(event);
        $rootScope.$digest();
        expect(renditions.ingest).toHaveBeenCalled();
        expect(renditions.crop).toHaveBeenCalled();
        expect(scope.onChange).not.toHaveBeenCalled();
        expect(scope.save).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(scope.item.associations.featured.headline).toBe('foo');
    }));

    it('can trigger onchange handler on drop when content is published', inject(($rootScope, renditions) => {
        var event = new window.$.Event('drop');

        scope.item.state = 'published';
        event.originalEvent = {dataTransfer: {
            types: ['video'],
            getData: () => angular.toJson({headline: 'foo', _type: 'externalsource'}),
        }};

        event.preventDefault = jasmine.createSpy('preventDefault');
        event.stopPropagation = jasmine.createSpy('stopPropagation');
        scope.onChange = jasmine.createSpy('onchange');
        scope.save = jasmine.createSpy('save');
        elem.triggerHandler(event);
        $rootScope.$digest();
        expect(renditions.ingest).toHaveBeenCalled();
        expect(renditions.crop).toHaveBeenCalled();
        expect(scope.onChange).toHaveBeenCalled();
        expect(scope.save).not.toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(scope.item.associations.featured.headline).toBe('foo');
    }));

    it('trigger onchange handler on drop when feature media is not editable',
        inject(($rootScope, renditions, config) => {
            var event = new window.$.Event('drop');

            config.features = {
                editFeaturedImage: 0,
            };
            scope.item.state = 'in_progress';
            event.originalEvent = {dataTransfer: {
                types: ['image'],
                getData: () => angular.toJson({headline: 'foo', _type: 'externalsource'}),
            }};

            event.preventDefault = jasmine.createSpy('preventDefault');
            event.stopPropagation = jasmine.createSpy('stopPropagation');
            scope.onChange = jasmine.createSpy('onchange');
            scope.save = jasmine.createSpy('save');
            elem.triggerHandler(event);
            $rootScope.$digest();
            expect(renditions.ingest).not.toHaveBeenCalled();
            expect(renditions.crop).not.toHaveBeenCalled();
            expect(scope.onChange).toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(scope.item.associations.featured.headline).toBe('foo');
        }));

    it('cannot associated media if item is locked.', inject(($rootScope, renditions, notify) => {
        var event = new window.$.Event('drop');

        scope.item.state = 'in_progress';
        event.originalEvent = {dataTransfer: {
            types: ['image'],
            getData: () => angular.toJson({headline: 'foo', _type: 'externalsource', lock_user: 'foo'}),
        }};

        notify.error = jasmine.createSpy('error');
        event.preventDefault = jasmine.createSpy('preventDefault');
        event.stopPropagation = jasmine.createSpy('stopPropagation');
        scope.onChange = jasmine.createSpy('onchange');
        scope.save = jasmine.createSpy('save');
        elem.triggerHandler(event);
        $rootScope.$digest();
        expect(notify.error).toHaveBeenCalled();
        expect(renditions.ingest).not.toHaveBeenCalled();
        expect(renditions.crop).not.toHaveBeenCalled();
    }));
});
