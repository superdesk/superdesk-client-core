
/**
* Module with tests for the sdIngestSourcesContent directive
*
* @module sdIngestSourcesContent directive tests
*/
describe('sdIngestSourcesContent directive', () => {
    var scope, directiveElement;

    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.apps.ingest'));
    beforeEach(window.module(($provide) => {
        $provide.constant('config', {
            model: {
                timeformat: 'HH:mm:ss',
                dateformat: 'DD/MM/YYYY',
            },
            view: {
                timeformat: 'HH:mm',
                dateformat: 'MM/DD/YYYY',
            },
            defaultTimezone: 'Europe/London',
            server: {url: undefined},
            ingest: {
                PROVIDER_DASHBOARD_DEFAULTS: {
                    show_log_messages: true,
                    show_ingest_count: true,
                    show_time: true,
                    log_messages: 'error',
                    show_status: true,
                },
                DEFAULT_SCHEDULE: {minutes: 5, seconds: 0},
                DEFAULT_IDLE_TIME: {hours: 0, minutes: 0},
            },
        });
    }));

    beforeEach(inject(($compile, $rootScope, $templateCache, ingestSources, $q) => {
        spyOn(ingestSources, 'fetchAllFeedingServicesAllowed').and.returnValue(Promise.resolve([{
            feeding_service: 'rss',
            label: 'RSS',
            fields: [
                {
                    id: 'text_field', type: 'text', label: 'Text Field',
                },
                {
                    id: 'password_field', type: 'password', label: 'Password Field',
                },
                {
                    id: 'field_aliases', type: 'mapping', label: 'Content Field Aliases',
                    first_field_options: {values: ['foo1', 'foo2', 'foo3', 'foo4']},
                },
                {
                    id: 'auth_required', type: 'boolean',
                },
                {
                    id: 'username', type: 'text', show_expression: '{auth_required}',
                },
            ],
        }]));

        var templateUrl = [
            'scripts', 'apps', 'ingest', 'views',
            'settings', 'ingest-sources-content.html',
        ].join('/');

        $templateCache.put(templateUrl, '<div sd-ingest-provider-config></div>');
        scope = $rootScope.$new();
        directiveElement = $compile('<form><div sd-ingest-sources-content></div></form>')(scope);
        scope.$digest();
    }));

    describe('edit() method', () => {
        var fakeProvider;

        beforeEach((done) => {
            fakeProvider = {
                _id: 'test-id',
                feeding_service: 'rss',
                config: {
                    field_aliases: [
                        {foo2: 'bar2'},
                        {foo4: 'bar4'},
                    ],
                },
            };

            scope.providers = {
                _items: [fakeProvider],
            };

            scope.waitForDirectiveReady().then(done);
        });

        it('updates the list of field name aliases to match provider\'s configuration', () => {
            scope.edit(fakeProvider);
            expect(scope.fieldAliases).toEqual({field_aliases: [
                {fieldName: 'foo2', alias: 'bar2'},
                {fieldName: 'foo4', alias: 'bar4'},
            ]});
        });

        it('updates the list of field names that don\'t have an alias set', () => {
            scope.edit(fakeProvider);
            expect(scope.fieldsNotSelected).toEqual(
                {field_aliases: ['foo1', 'foo3']}
            );
        });

        it('should initialize provider configuration', () => {
            scope.provider = {feeding_service: 'service1'};
            scope.feedingServices = [{
                feeding_service: 'service1',
                parser_restricted_values: ['parser1'],
            }, {
                feeding_service: 'service2',
                parser_restricted_values: ['parser1', 'parser2'],
            }];
            scope.allFeedParsers = [{feed_parser: 'parser1'}, {feed_parser: 'parser2'}, {feed_parser: 'parser3'}];

            scope.initProviderConfig();
            expect(scope.provider.feed_parser).toEqual('parser1');
            expect(scope.feedParsers).toEqual([{feed_parser: 'parser1'}]);

            scope.provider = {feeding_service: 'service2'};
            scope.initProviderConfig();
            expect(scope.provider.feed_parser).toBe(null);
            expect(scope.feedParsers).toEqual([{feed_parser: 'parser1'}, {feed_parser: 'parser2'}]);
        });

        it('should contain configuration fields', () => {
            scope.edit(fakeProvider);
            scope.$digest();
            var found = directiveElement.find('input[id="rss-text_field"]');

            expect(found.length).toEqual(1);
            expect(found[0].type).toEqual('text');

            found = directiveElement.find('input[id="rss-password_field"]');
            expect(found.length).toEqual(1);
            expect(found[0].type).toEqual('password');

            found = directiveElement.find('select[ng-model="item.fieldName"]');
            expect(found.length).toEqual(2);
            expect(found[0].value).toEqual('string:foo2');
            expect(found[1].value).toEqual('string:foo4');

            found = directiveElement.find('input[ng-model="item.alias"]');
            expect(found.length).toEqual(2);
            expect(found[0].type).toEqual('text');
            expect(found[1].type).toEqual('text');

            found = directiveElement.find('span[id="rss-auth_required"]');
            expect(found.length).toEqual(1);

            found = directiveElement.find('input[id="rss-username"]');
            expect(found.length).toEqual(1);
            expect(found[0].type).toEqual('text');
            expect(scope.isConfigFieldVisible({show_expression: '{auth_required}'})).toBeFalsy();

            scope.provider.config.auth_required = true;
            scope.$digest();
            found = directiveElement.find('input[id="rss-username"]');
            expect(found.length).toEqual(1);
            expect(scope.isConfigFieldVisible({show_expression: '{auth_required}'})).toBe(true);
        });
    });

    describe('addFieldAlias() method', () => {
        beforeEach((done) => {
            scope.waitForDirectiveReady().then(done);
        });

        it('appends a new item to the list of field aliases', () => {
            scope.fieldAliases = {field_aliases: [
                {fieldName: 'foo1', alias: 'bar1'},
                {fieldName: 'foo2', alias: 'bar2'},
            ]};

            scope.addFieldAlias('field_aliases');

            expect(scope.fieldAliases).toEqual({field_aliases: [
                {fieldName: 'foo1', alias: 'bar1'},
                {fieldName: 'foo2', alias: 'bar2'},
                {fieldName: null, alias: ''},
            ]});
        });
    });

    describe('removeFieldAlias() and fieldSelectionChanged() methods', () => {
        beforeEach((done) => {
            scope.fieldAliases = {field_aliases: [
                {fieldName: 'foo1', alias: 'bar1'},
                {fieldName: 'foo2', alias: 'bar2'},
                {fieldName: 'foo3', alias: 'bar3'},
            ]};
            scope.fieldsNotSelected = {field_aliases: ['foo4']};

            scope.waitForDirectiveReady().then(done);
        });

        it('removes an item at given index from the list of field aliases', () => {
            scope.removeFieldAlias('field_aliases', 1);
            expect(scope.fieldAliases).toEqual({field_aliases: [
                {fieldName: 'foo1', alias: 'bar1'},
                {fieldName: 'foo3', alias: 'bar3'},
            ]});
        });

        it('adds removed items\'s selected field name to the list of not selected fields', () => {
            scope.removeFieldAlias('field_aliases', 1);
            expect(scope.fieldsNotSelected).toEqual({field_aliases: ['foo4', 'foo2']});
        });

        it('does not modify the list of not selected fields if removed ' +
           'alias item did not have a field name selected', () => {
            scope.fieldAliases.field_aliases[1].fieldName = null;
            scope.fieldSelectionChanged({
                id: 'field_aliases', type: 'mapping', label: 'Content Field Aliases',
                first_field_options: {values: ['foo1', 'foo2', 'foo3', 'foo4']},
            });
            expect(scope.fieldsNotSelected).toEqual({field_aliases: ['foo2', 'foo4']});

            scope.removeFieldAlias('field_aliases', 1);

            expect(scope.fieldsNotSelected).toEqual({field_aliases: ['foo2', 'foo4']});
        });
    });

    describe('availableFieldOptions() method', () => {
        beforeEach((done) => {
            scope.fieldsNotSelected = {field_aliases: ['foo1', 'foo3']};

            scope.waitForDirectiveReady().then(done);
        });

        it('returns only the field names currently not selected if no field name is given', () => {
            var fieldNames = scope.availableFieldOptions('field_aliases', null);

            expect(fieldNames).toEqual(['foo1', 'foo3']);
        });

        it('returns field names currently not selected plus the given field name', () => {
            var fieldNames = scope.availableFieldOptions('field_aliases', 'foo4');

            expect(fieldNames).toEqual(['foo1', 'foo3', 'foo4']);
        });
    });

    describe('save() method', () => {
        var deferredSave, fakeProvider;

        beforeEach((done) => {
            inject(($q, api) => {
                deferredSave = $q.defer();

                api.ingestProviders.save = jasmine.createSpy().and.returnValue(deferredSave.promise);

                fakeProvider = {_id: 'test-id', feeding_service: 'rss', config: {}};

                scope.providers = {
                    _items: [fakeProvider],
                };

                scope.waitForDirectiveReady().then(done);
            });
        });

        it('updates field aliases in provider configuration', () => {
            scope.edit(fakeProvider);
            scope.fieldAliases = {field_aliases: [
                {fieldName: 'foo1', alias: 'bar1'},
                {fieldName: 'foo2', alias: 'bar2'},
            ]};
            scope.save();
            expect(scope.provider.config.field_aliases).toEqual(
                [{foo1: 'bar1'}, {foo2: 'bar2'}]
            );
        });

        it('does not add field aliases with missing data to provider configuration', () => {
            scope.edit(fakeProvider);
            scope.fieldAliases = {field_aliases: [
                {fieldName: 'foo1', alias: ''},
                {fieldName: null, alias: 'some_alias'},
                {fieldName: null, alias: ''},
            ]};
            scope.save();
            expect(scope.provider.config.field_aliases).toEqual([]);
        });
    });
});
