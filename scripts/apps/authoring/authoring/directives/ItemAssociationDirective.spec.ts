import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {appConfig} from 'appConfig';

describe('item association directive', () => {
    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            server: {
                url: '',
                ws: undefined,
            },
        };

        Object.assign(appConfig, testConfig);
    });
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    var elem, scope, item = {associations: {}};

    beforeEach(inject(($compile, $rootScope, renditions, $q) => {
        scope = $rootScope.$new();
        scope.rel = 'featured';
        scope.item = item;
        scope.editable = true;

        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            features: {
                ...appConfig.features,
                editFeaturedImage: true,
            },
        };

        Object.assign(appConfig, testConfig);

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
            data-allow-picture="true"
            data-allow-video="true"
            data-allow-audio="true"
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
            types: ['application/superdesk.item.video'],
            getData: () => angular.toJson({headline: 'foo', _type: 'externalsource'}),
        }};

        event.preventDefault = jasmine.createSpy('preventDefault');
        event.stopPropagation = jasmine.createSpy('stopPropagation');
        scope.onChange = jasmine.createSpy('onchange').and.returnValue(Promise.resolve(true));
        scope.save = jasmine.createSpy('save').and.returnValue(Promise.resolve(true));
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
            types: ['application/superdesk.item.video'],
            getData: () => angular.toJson({headline: 'foo', _type: 'externalsource'}),
        }};

        event.preventDefault = jasmine.createSpy('preventDefault');
        event.stopPropagation = jasmine.createSpy('stopPropagation');
        scope.onChange = jasmine.createSpy('onchange').and.returnValue(Promise.resolve(true));
        scope.save = jasmine.createSpy('save').and.returnValue(Promise.resolve(true));

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
        inject(($rootScope, renditions) => {
            var event = new window.$.Event('drop');

            const testConfig: Partial<ISuperdeskGlobalConfig> = {
                features: {
                    ...appConfig.features,
                    editFeaturedImage: 0,
                },
            };

            Object.assign(appConfig, testConfig);

            scope.item.state = 'in_progress';
            event.originalEvent = {dataTransfer: {
                types: ['application/superdesk.item.picture'],
                getData: () => angular.toJson({headline: 'foo', _type: 'externalsource'}),
            }};

            event.preventDefault = jasmine.createSpy('preventDefault');
            event.stopPropagation = jasmine.createSpy('stopPropagation');
            scope.onChange = jasmine.createSpy('onchange').and.returnValue(Promise.resolve(true));
            scope.save = jasmine.createSpy('save').and.returnValue(Promise.resolve(true));
            elem.triggerHandler(event);
            $rootScope.$digest();
            expect(renditions.ingest).not.toHaveBeenCalled();
            expect(renditions.crop).not.toHaveBeenCalled();
            expect(scope.onChange).toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(scope.item.associations.featured.headline).toBe('foo');
        }));

    it('cannot associated media if item is locked.', inject(($rootScope, renditions, notify, api, $q) => {
        var event = new window.$.Event('drop');

        spyOn(api, 'find').and.returnValue($q.when({lock_user: 'foo'}));

        scope.item.state = 'in_progress';
        event.originalEvent = {dataTransfer: {
            types: ['application/superdesk.item.picture'],
            getData: () => angular.toJson({_id: 'foo', _type: 'archive'}),
        }};

        notify.error = jasmine.createSpy('error');
        event.preventDefault = jasmine.createSpy('preventDefault');
        event.stopPropagation = jasmine.createSpy('stopPropagation');
        elem.triggerHandler(event);
        $rootScope.$digest();
        expect(notify.error).toHaveBeenCalled();
    }));
});
