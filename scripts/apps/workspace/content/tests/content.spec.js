
import {waitUntil} from 'core/helpers/waitUtil';

describe('superdesk.apps.workspace.content', () => {
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.workspace.content'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    describe('content service', () => {
        var done;
        var ITEM = {};

        beforeEach(inject((api, $q, preferencesService) => {
            spyOn(api, 'save').and.returnValue($q.when(ITEM));
            done = jasmine.createSpy('done');
            spyOn(preferencesService, 'update').and.returnValue(true);
        }));

        it('can create plain text items', inject((api, content, $rootScope) => {
            content.createItem().then(done);
            $rootScope.$digest();
            expect(api.save).toHaveBeenCalledWith('archive', {type: 'text', version: 0});
            expect(done).toHaveBeenCalledWith(ITEM);
        }));

        it('can create packages', inject((api, content, desks, session, $rootScope) => {
            session.identity = {_id: '1'};
            desks.userDesks = {_items: []};
            spyOn(desks, 'getCurrentDesk')
                .and
                .returnValue({_id: '1', name: 'sport', working_stage: '2', incoming_stage: '3'});

            content.createPackageItem().then(done);
            $rootScope.$digest();
            expect(api.save).toHaveBeenCalledWith('archive', {headline: '', slugline: '',
                description_text: '', type: 'composite',
                groups: [{role: 'grpRole:NEP', refs: [{idRef: 'main'}], id: 'root'},
                    {refs: [], id: 'main', role: 'grpRole:main'}], version: 0,
                task: {desk: '1', stage: '2', user: '1'}});
            expect(done).toHaveBeenCalledWith(ITEM);
        }));

        it('can create packages from items', inject((api, content, session, desks, $rootScope) => {
            session.identity = {_id: '1'};

            spyOn(desks, 'getCurrentDesk')
                .and
                .returnValue({_id: '1', name: 'sport', working_stage: '2', incoming_stage: '3'});

            content.createPackageFromItems({data: 123}).then(done);
            $rootScope.$digest();
            expect(api.save).toHaveBeenCalledWith('archive', {
                headline: '', slugline: '',
                description_text: '',
                state: 'draft',
                type: 'composite',
                version: 0,
                task: {desk: '1', stage: '2', user: '1'},
                groups: [
                    {role: 'grpRole:NEP', refs: [{idRef: 'main'}], id: 'root'},
                    {refs: [{headline: '', residRef: undefined, location: 'archive',
                        slugline: '', renditions: {}, itemClass: '', type: ''}],
                    id: 'main', role: 'grpRole:main'}]});
        }));

        it('can create items from template', inject((api, content, desks, session, $rootScope) => {
            session.identity = {_id: 'user:1', byline: 'user1'};

            spyOn(desks, 'getCurrentDesk')
                .and
                .returnValue({_id: '2', name: 'news', working_stage: '4', incoming_stage: '5'});

            content.createItemFromTemplate({
                _id: 'template1',
                data: {
                    slugline: 'test_slugline',
                    body_html: 'test_body_html',
                    irrelevantData: 'yes',
                },
            }).then(done);

            $rootScope.$digest();
            expect(done).toHaveBeenCalledWith(ITEM);
            expect(api.save).toHaveBeenCalledWith('archive', {
                slugline: 'test_slugline',
                body_html: 'test_body_html',
                task: {desk: '2', stage: '4', user: 'user:1'},
                template: 'template1',
                type: 'text',
                version: 0,
                byline: 'user1',
            });
        }));

        it('can fetch content types', inject((api, content, $rootScope, $q) => {
            var types = [{_id: 'foo'}];

            spyOn(api, 'getAll').and.returnValue($q.when(types));
            var success = jasmine.createSpy('ok');

            content.getTypes().then(success);
            $rootScope.$digest();
            expect(api.getAll).toHaveBeenCalledWith('content_types', {where: {enabled: true}}, false);
            expect(success).toHaveBeenCalledWith(types);
            expect(content.types).toBe(types);
        }));

        it('can fetch content types and filter by desk', inject((content, $rootScope, $q) => {
            spyOn(content, 'getTypes').and.returnValue($q.when([
                {_id: 'foo'},
                {_id: 'bar'},
                {_id: 'baz'},
            ]));

            var profiles;

            content.getDeskProfiles({content_profiles: {bar: 1}}, 'baz').then((_profiles) => {
                profiles = _profiles;
            });

            $rootScope.$digest();
            expect(profiles.length).toBe(2);
            expect(profiles[0]._id).toBe('bar');
            expect(profiles[1]._id).toBe('baz');
        }));

        it('can generate content types lookup dict', inject((content, $q, $rootScope) => {
            spyOn(content, 'getTypes').and.returnValue($q.when([{_id: 'foo', name: 'Foo'}, {_id: 'bar'}]));
            var lookup;

            content.getTypesLookup().then((_lookup) => {
                lookup = _lookup;
            });

            $rootScope.$digest();
            expect(lookup.foo.name).toBe('Foo');
        }));

        it('can get content type', inject((api, content, $rootScope, $q) => {
            var type = {_id: 'foo'};

            spyOn(api, 'getAll').and.returnValue($q.when([]));
            spyOn(api, 'find').and.returnValue($q.when(type));
            var success = jasmine.createSpy('ok');

            content.getType('foo').then(success);
            $rootScope.$digest();
            expect(api.find).toHaveBeenCalledWith('content_types', 'foo');
            expect(success).toHaveBeenCalledWith(type);
        }));

        it('can create item using content type', inject((api, content, desks, session) => {
            var type = {_id: 'test'};
            var success = jasmine.createSpy('ok');

            spyOn(desks, 'getCurrentDesk').and.returnValue({_id: 'sports', working_stage: 'inbox'});
            session.identity = {_id: 'foo'};
            content.createItemFromContentType(type).then(success);
            expect(api.save).toHaveBeenCalledWith('archive', {
                profile: type._id,
                type: 'text',
                version: 0,
                task: {desk: 'sports', stage: 'inbox', user: 'foo'},
            });
        }));

        it('can get schema for content type', inject((content) => {
            var schema = content.schema();

            expect(schema.headline).toBeTruthy();
            expect(schema.slugline).toBeTruthy();
            expect(schema.body_html).toBeTruthy();

            var contentType = {schema: {foo: 1}};

            schema = content.schema(contentType);
            expect(schema.headline).toBeFalsy();
            expect(schema.foo).toBeTruthy();
            expect(schema).not.toBe(content.schema(contentType)); // check it is a copy
        }));

        it('can get editor config for content type', inject((content) => {
            var editor = content.editor();

            expect(editor.slugline.order).toBe(1);

            var contentType = {editor: {foo: 2}};

            editor = content.editor(contentType);
            expect(editor.foo).toBe(2);
            expect(editor.slugline).toBeFalsy();
        }));

        it('can get custom package schema', inject((content, deployConfig) => {
            const packageSchema = {headline: {}};

            spyOn(deployConfig, 'getSync').and.returnValue({composite: packageSchema});

            const schema = content.schema(null, 'composite');

            expect(deployConfig.getSync).toHaveBeenCalledWith('schema');
            expect(schema).toEqual(packageSchema);
        }));

        it('can get custom package editor', inject((content, deployConfig) => {
            const packageEditor = {headline: {}};

            spyOn(deployConfig, 'getSync').and.returnValue({composite: packageEditor});

            const editor = content.editor(null, 'composite');

            expect(deployConfig.getSync).toHaveBeenCalledWith('editor');
            expect(editor).toEqual(packageEditor);
        }));

        it('can filter custom fields per profile', inject((content) => {
            content._fields = [
                {_id: 'foo'},
                {_id: 'bar'},
            ];

            const fields = content.fields({editor: {foo: {enabled: true}}});

            expect(fields.length).toBe(1);
            expect(fields[0]._id).toBe('foo');
        }));
    });

    describe('content profiles controller', () => {
        beforeEach(window.module('superdesk.mocks'));
        beforeEach(window.module('superdesk.apps.workspace.content'));

        it('should load profiles on start', inject(($controller, content, $q, $rootScope) => {
            spyOn(content, 'getTypes').and.returnValue($q.when('list'));
            var scope = $rootScope.$new();
            var ctrl = $controller('ContentProfilesController', {$scope: scope});

            scope.$digest();
            expect(content.getTypes).toHaveBeenCalledWith(true);
            expect(ctrl.items).toBe('list');
        }));

        it('should notify appropriate error when created profile is not unique', inject((
            notify, $controller, content, $q, $rootScope) => {
            spyOn(content, 'createProfile').and.returnValue($q.reject({
                data: {_issues: {label: {unique: 1}}},
            }));
            var errorFn = spyOn(notify, 'error');
            var scope = $rootScope.$new();
            var ctrl = $controller('ContentProfilesController', {$scope: scope});

            ctrl.save();
            scope.$digest();
            expect(errorFn).toHaveBeenCalledWith(ctrl.duplicateErrorTxt);
        }));

        it('should log appropriate error when created profile is unique', inject((
            notify, $controller, content, $q, $rootScope) => {
            spyOn(content, 'createProfile').and.returnValue($q.reject({
                data: {_issues: {label: {other_error: 1}}},
            }));
            var errorFn = spyOn(notify, 'error');
            var scope = $rootScope.$new();
            var ctrl = $controller('ContentProfilesController', {$scope: scope});

            ctrl.save();
            scope.$digest();
            expect(errorFn).not.toHaveBeenCalledWith(ctrl.duplicateErrorTxt);
        }));
    });

    describe('content profiles schema editor', () => {
        var compile;

        beforeEach(window.module('superdesk.apps.workspace.content'));

        beforeEach(inject((_$compile_, _$rootScope_) => {
            compile = function(props) {
                var scope = _$rootScope_.$new();

                angular.extend(scope, props);
                return _$compile_(
                    '<form><sd-content-schema-editor data-model="model"></sd-content-schema-editor></form>'
                )(scope);
            };
        }));

        it('render correctly all fields', (done) => {
            inject((content, vocabularies, $q) => {
                var el = compile({
                    model: {},
                });

                spyOn(content, 'getTypeMetadata').and.returnValue($q.when({schema: content.contentProfileSchema,
                    editor: content.contentProfileEditor}));

                spyOn(content, 'getCustomFields').and.returnValue($q.when([]));
                spyOn(vocabularies, 'getAllActiveVocabularies').and.returnValue($q.when([]));

                waitUntil(() => {
                    el.scope().$digest();
                    return el.find('li.schema-item').length > 0;
                }).then(() => {
                    done();
                    var fields = el.find('li.schema-item');

                    expect(fields.length).toBe(Object.keys(content.contentProfileEditor).length);
                });
            });
        });

        it('should dirty parent form when toggling fields', (done) => {
            inject((content, vocabularies, $q) => {
                var el = compile({
                    model: {},
                });

                spyOn(content, 'getTypeMetadata').and.returnValue($q.when({schema: content.contentProfileSchema,
                    editor: content.contentProfileEditor}));

                spyOn(content, 'getCustomFields').and.returnValue($q.when([]));
                spyOn(vocabularies, 'getAllActiveVocabularies').and.returnValue($q.when([]));

                waitUntil(() => {
                    el.scope().$digest();
                    return el.find('li').length > 0;
                }).then(() => {
                    done();
                    var fields = el.find('li');
                    var form = el.controller('form');

                    expect(form.$dirty).toBeFalsy();
                    $(fields[0])
                        .find('#remove-item')
                        .click();
                    expect(form.$dirty).toBeTruthy();
                });
            });
        });
    });
});
