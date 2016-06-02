
'use strict';

describe('superdesk.workspace.content', function() {

    beforeEach(module('superdesk.mocks'));
    beforeEach(module('superdesk.desks'));
    beforeEach(module('superdesk.templates-cache'));
    beforeEach(module('superdesk.workspace.content'));

    describe('content service', function() {
        var done;
        var ITEM = {};

        beforeEach(inject(function(api, $q, preferencesService) {
            spyOn(api, 'save').and.returnValue($q.when(ITEM));
            done = jasmine.createSpy('done');
            spyOn(preferencesService, 'update').and.returnValue(true);
        }));

        it('can create plain text items', inject(function(api, content, $rootScope) {
            content.createItem().then(done);
            $rootScope.$digest();
            expect(api.save).toHaveBeenCalledWith('archive', {type: 'text', version: 0});
            expect(done).toHaveBeenCalledWith(ITEM);
        }));

        it('can create packages', inject(function(api, content, desks, session, $rootScope) {
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

        it('can create packages from items', inject(function(api, content, session, desks, $rootScope) {
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
                slugline: '', renditions: {}, itemClass: ''}],
                id: 'main', role: 'grpRole:main'}]});
        }));

        it('can create items from template', inject(function(api, content, desks, session, $rootScope) {
            session.identity = {_id: 'user:1'};

            spyOn(desks, 'getCurrentDesk')
                .and
                .returnValue({_id: '2', name: 'news', working_stage: '4', incoming_stage: '5'});

            content.createItemFromTemplate({
                _id: 'template1',
                data: {
                    slugline: 'test_slugline',
                    body_html: 'test_body_html',
                    irrelevantData: 'yes'
                }
            }).then(done);

            $rootScope.$digest();
            expect(done).toHaveBeenCalledWith(ITEM);
            expect(api.save).toHaveBeenCalledWith('archive', {
                slugline: 'test_slugline',
                body_html: 'test_body_html',
                task: {desk: '2', stage: '4', user: 'user:1'},
                template: 'template1',
                type: 'text',
                version: 0
            });
        }));

        it('can fetch content types', inject(function(api, content, $rootScope, $q) {
            var types = [{_id: 'foo'}];
            spyOn(api, 'query').and.returnValue($q.when({_items: types}));
            var success = jasmine.createSpy('ok');
            content.getTypes().then(success);
            $rootScope.$digest();
            expect(api.query).toHaveBeenCalledWith('content_types', {where: {enabled: true}});
            expect(success).toHaveBeenCalledWith(types);
            expect(content.types).toBe(types);
        }));

        it('can get content type', inject(function(api, content, $rootScope, $q) {
            var type = {_id: 'foo'};
            spyOn(api, 'find').and.returnValue($q.when(type));
            var success = jasmine.createSpy('ok');
            content.getType('foo').then(success);
            $rootScope.$digest();
            expect(api.find).toHaveBeenCalledWith('content_types', 'foo');
            expect(success).toHaveBeenCalledWith(type);
        }));

        it('can create item using content type', inject(function(api, content, desks, session) {
            var type = {_id: 'test'};
            var success = jasmine.createSpy('ok');
            spyOn(desks, 'getCurrentDesk').and.returnValue({_id: 'sports', working_stage: 'inbox'});
            session.identity = {_id: 'foo'};
            content.createItemFromContentType(type).then(success);
            expect(api.save).toHaveBeenCalledWith('archive', {
                profile: type._id,
                type: 'text',
                version: 0,
                task: {desk: 'sports', stage: 'inbox', user: 'foo'}
            });
        }));

        it('can get schema for content type', inject(function(content) {
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

        it('can get editor config for content type', inject(function(content) {
            var editor = content.editor();
            expect(editor.slugline.order).toBe(1);

            var contentType = {editor: {foo: 2}};
            editor = content.editor(contentType);
            expect(editor.foo).toBe(2);
            expect(editor.slugline).toBeFalsy();
        }));
    });

    describe('content profiles controller', function() {
        beforeEach(module('superdesk.mocks'));
        beforeEach(module('superdesk.workspace.content'));

        it('should load profiles on start', inject(function($controller, content, $q, $rootScope) {
            spyOn(content, 'getTypes').and.returnValue($q.when('list'));
            var scope = $rootScope.$new();
            var ctrl = $controller('ContentProfilesController', {$scope: scope});
            scope.$digest();
            expect(content.getTypes).toHaveBeenCalledWith(true);
            expect(ctrl.items).toBe('list');
        }));
    });

    describe('content profiles schema editor', function() {
        var compile;

        beforeEach(module('superdesk.workspace.content'));

        beforeEach(inject(function(_$compile_, _$rootScope_) {
            compile = function(props) {
                var scope = _$rootScope_.$new();
                angular.extend(scope, props);
                return _$compile_(
                    '<form><sd-content-schema-editor ng-model="schema"></sd-content-schema-editor></form>'
                )(scope);
            };
        }));

        it('render correctly', function() {
            var el = compile({
                schema: {
                    'headline': {},
                    'slugline': null
                }
            });

            el.scope().$digest();

            var fields = el.find('li');
            expect(fields.length).toBe(2);
            expect($(fields[0]).find('span.sd-toggle').hasClass('checked')).toBeTruthy();
            expect($(fields[1]).find('span.sd-toggle').hasClass('checked')).toBeFalsy();
        });

        it('should dirty parent form when toggling fields', function() {
            var el = compile({
                schema: {
                    'headline': {},
                    'slugline': null
                }
            });

            el.scope().$digest();

            var fields = el.find('li');
            var form = el.controller('form');

            expect(form.$dirty).toBeFalsy();
            $(fields[1]).find('span.sd-toggle').click();
            expect(form.$dirty).toBeTruthy();
        });
    });
});
