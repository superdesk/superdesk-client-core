

describe('MetadataWidgetCtrl controller', () => {
    var metadata, // the metadata service
        metaInit, // deferred initialization of the metadata service
        prefsGet, // deferred result of the preferences service's get() method
        scope;

    beforeEach(window.module('superdesk.apps.publish'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.core.ui'));
    beforeEach(window.module('superdesk.core.filters'));
    beforeEach(window.module('superdesk.apps.authoring.metadata'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

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
        });
    }));

    beforeEach(inject((
        $rootScope, $controller, $q, _metadata_, preferencesService
    ) => {
        metadata = _metadata_;

        metaInit = $q.defer();
        prefsGet = $q.defer();

        spyOn(metadata, 'initialize').and.returnValue(metaInit.promise);
        spyOn(preferencesService, 'get').and.returnValue(prefsGet.promise);

        scope = $rootScope.$new();
        scope.item = {
            publish_schedule: '2015-08-01T15:12:34+0000',
            schedule_settings: {time_zone: 'Europe/Prague'},
        };
        $controller('MetadataWidgetCtrl', {$scope: scope});
    }));

    it('can resolve schedule datetime', () => {
        expect(scope.item.publish_schedule_date).toBe('01/08/2015');
        expect(scope.item.publish_schedule_time).toBe('15:12:34');
    });

    it('initializes the list of categories to pick from in scope', () => {
        var userPrefs = {
            'categories:preferred': {
                selected: {a: true, b: false, c: true, d: true},
            },
        };

        metadata.values = {
            categories: [
                {qcode: 'a'}, {qcode: 'b'}, {qcode: 'c'}, {qcode: 'd'},
            ],
        };

        // set the 'd' category to be already assigned to the article
        // it will not be in the available list as it is already assigned to the
        // item
        scope.item.anpa_category = [{qcode: 'd'}];

        metaInit.resolve();
        prefsGet.resolve(userPrefs);
        scope.$digest();

        expect(scope.availableCategories).toEqual(
            [{qcode: 'a'}, {qcode: 'c'}]
        );
    });

    it('can pupulate list of categories for new users', () => {
        metadata.values = {
            categories: [
                {qcode: 'a'}, {qcode: 'b'}, {qcode: 'c'}, {qcode: 'd'},
            ],
        };

        metaInit.resolve();
        prefsGet.resolve({'categories:preferred': {selected: {}}});
        scope.$digest();

        expect(scope.availableCategories.length).toBe(4);
    });
});

describe('metadata terms directive', () => {
    var $rootScope,
        $compile,
        itemCategories,
        subjects,
        itemSubjects,
        availableCategories,
        itemCompanyCodes,
        availableCompanyCodes;

    itemCategories = [{name: 'National', qcode: 'a'}, {name: 'Sports', qcode: 's'}];
    availableCategories = [{name: 'International', qcode: 'i'},
        {name: 'Domestic Sport', qcode: 't'}, {name: 'Motor Racing', qcode: 'm'},
        {name: 'Horse Racing', qcode: 'r'}];

    itemCompanyCodes = [{name: '1-PAGE LIMITED', qcode: '1PG'}, {name: '1300 SMILES LIMITED', qcode: 'ONT'}];
    availableCompanyCodes = [{name: '1ST AVAILABLE LTD', qcode: '1ST'},
        {name: '360 CAPITAL GROUP', qcode: 'TGP'}, {name: '360 CAPITAL INDUSTRIAL FUND', qcode: 'TIX'},
        {name: '360 CAPITAL OFFICE FUND', qcode: 'TOF'}];

    subjects = [{name: 'a', qcode: '123'},
        {name: 'b', qcode: '456', parent: '123'},
        {name: 'c', qcode: '789', parent: '123'},
        {name: 'test', qcode: '111'},
        {name: 'test-abc', qcode: '222', parent: '111'},
        {name: 'test-efg', qcode: '333', parent: '111'},
        {name: 'test-ttt', qcode: '444', parent: '111'},
        {name: 'test-xyz', qcode: '211', parent: '222'},
        {name: 'test-foo', qcode: '212', parent: '222'},
        {name: 'test-bar', qcode: '213', parent: '222'},
    ];
    itemSubjects = [{name: 'b', qcode: '456', parent: '123'}, {name: 'test', qcode: '111'}];

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.core.api'));
    beforeEach(window.module('superdesk.core.filters'));
    beforeEach(window.module('superdesk.apps.publish'));
    beforeEach(window.module('superdesk.apps.authoring.metadata'));
    beforeEach(window.module('superdesk.apps.vocabularies'));

    beforeEach(inject((_$rootScope_, _$compile_) => {
        $rootScope = _$rootScope_;
        $compile = _$compile_;
    }));

    function compileDirective(html, scopeValues) {
        var scope = $rootScope.$new();

        angular.extend(scope, scopeValues);
        return $compile(html)(scope);
    }

    it('combined list contains all company_codes and terms contains only available company_codes', inject(() => {
        var elmHtml = '<div sd-meta-terms ng-disabled="!_editable" ' +
                      'data-item="item" data-field="company_codes" data-unique="qcode" ' +
                      'data-list="availableCompanyCodes" data-header="true" ' +
                      'data-reload-list="false"></div>';

        var iScope;
        var scopeValues = {
            item: {
                company_codes: itemCompanyCodes,
            },
            _editable: true,
            availableCompanyCodes: availableCompanyCodes,
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        expect(iScope.terms.length).toBe(4);
        expect(iScope.activeTree.length).toBe(4);
        expect(iScope.uniqueField).toBe('qcode');
        expect(iScope.combinedList.length).toBe(6);
    }));

    it('combined list all categories and terms contains only available category', inject(() => {
        var elmHtml = '<div sd-meta-terms ng-disabled="!_editable" ' +
                      'data-item="item" data-field="anpa_category" data-unique="qcode" ' +
                      'data-list="availableCategories" data-header="true" data-reload-list="false"></div>';

        var iScope;
        var scopeValues = {
            item: {
                anpa_category: itemCategories,
            },
            _editable: true,
            availableCategories: availableCategories,
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        expect(iScope.terms.length).toBe(4);
        expect(iScope.activeTree.length).toBe(4);
        expect(iScope.uniqueField).toBe('qcode');
        expect(iScope.combinedList.length).toBe(6);
    }));

    it('select a metadata term', inject(() => {
        var elmHtml = '<div sd-meta-terms ng-disabled="!_editable" ' +
                      'data-item="item" data-field="anpa_category" data-unique="qcode" ' +
                      'data-list="availableCategories" data-header="true" data-reload-list="false"></div>';

        var iScope;
        var scopeValues = {
            item: {
                anpa_category: itemCategories,
            },
            _editable: true,
            availableCategories: availableCategories,
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        iScope.selectTerm(availableCategories[0]);
        expect(iScope.terms.length).toBe(3);
        expect(iScope.activeTree.length).toBe(3);
        expect(iScope.combinedList.length).toBe(6);
    }));

    it('select all metadata terms', inject(() => {
        var elmHtml = '<div sd-meta-terms ng-disabled="!_editable" ' +
                      'data-item="item" data-field="anpa_category" data-unique="qcode" ' +
                      'data-list="availableCategories" data-header="true" data-reload-list="false"></div>';

        var iScope;
        var scopeValues = {
            item: {
                anpa_category: itemCategories,
            },
            _editable: true,
            availableCategories: availableCategories,
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        expect(iScope.item[iScope.field].length).toBe(2);
        expect(iScope.terms.length).toBe(4);
        expect(iScope.activeTree.length).toBe(4);
        _.each(availableCategories, (category) => {
            iScope.selectTerm(category);
        });
        expect(iScope.terms.length).toBe(0);
        expect(iScope.activeTree.length).toBe(0);
        expect(iScope.item[iScope.field].length).toBe(6);
    }));

    it('search a metadata term', inject(() => {
        var elmHtml = '<div sd-meta-terms ng-disabled="!_editable" ' +
                      'data-item="item" data-field="anpa_category" data-unique="qcode" ' +
                      'data-list="availableCategories" data-header="true" data-reload-list="false"></div>';

        var iScope;
        var scopeValues = {
            item: {
                anpa_category: itemCategories,
            },
            _editable: true,
            availableCategories: availableCategories,
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        iScope.searchTerms('racing');
        expect(iScope.terms.length).toBe(2);
        expect(iScope.activeTree.length).toBe(4);
        expect(iScope.activeList).toBe(true);
        expect(iScope.combinedList.length).toBe(6);
    }));

    it('search a metadata term if field not set', inject(() => {
        var elmHtml = '<div sd-meta-terms ng-disabled="!_editable" ' +
                      'data-item="item" data-field="anpa_category" data-unique="qcode" ' +
                      'data-list="availableCategories" data-header="true" data-reload-list="false"></div>';

        var iScope;
        var scopeValues = {
            item: {},
            _editable: true,
            availableCategories: availableCategories,
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        iScope.searchTerms('racing');
        expect(iScope.terms.length).toBe(2);
        expect(iScope.activeTree.length).toBe(4);
        expect(iScope.activeList).toBe(true);
        expect(iScope.combinedList.length).toBe(4);
    }));

    it('remove a metadata term', inject(() => {
        var elmHtml = '<div sd-meta-terms ng-disabled="!_editable" ' +
                      'data-item="item" data-field="anpa_category" data-unique="qcode" ' +
                      'data-list="availableCategories" data-header="true" data-reload-list="false"></div>';

        var iScope;
        var scopeValues = {
            item: {
                anpa_category: itemCategories,
            },
            _editable: true,
            availableCategories: availableCategories,
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        iScope.removeTerm(iScope.item[iScope.field][0]);
        expect(iScope.terms.length).toBe(5);
        expect(iScope.activeTree.length).toBe(5);
        expect(iScope.combinedList.length).toBe(6);
    }));

    it('list of tree type', inject(() => {
        var elmHtml = '<div sd-meta-terms ng-disabled="!_editable" ' +
                      'data-item="item" data-field="subjects" data-unique="qcode" ' +
                      'data-list="subjects" data-header="true" data-reload-list="true"></div>';

        var iScope;
        var scopeValues = {
            item: {
                subjects: itemSubjects,
            },
            _editable: true,
            subjects: subjects,
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        expect(iScope.terms.length).toBe(8);
        expect(iScope.activeTree.length).toBe(2);
        expect(iScope.uniqueField).toBe('qcode');
    }));

    it('search of tree type', inject(() => {
        var elmHtml = '<div sd-meta-terms ng-disabled="!_editable" ' +
                      'data-item="item" data-field="subjects" data-unique="qcode" ' +
                      'data-list="subjects" data-header="true" data-reload-list="true"></div>';

        var iScope;
        var scopeValues = {
            item: {
                subjects: itemSubjects,
            },
            _editable: true,
            subjects: subjects,
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        iScope.searchTerms('foo');
        expect(iScope.terms.length).toBe(1);
        expect(iScope.activeTree.length).toBe(2);
    }));

    it('select metadata term from tree type metadata dropdown', inject(() => {
        var elmHtml = '<div sd-meta-terms ng-disabled="!_editable" ' +
                      'data-item="item" data-field="subjects" data-unique="qcode" ' +
                      'data-list="subjects" data-header="true" data-reload-list="true"></div>';

        var iScope;
        var scopeValues = {
            item: {
                subjects: itemSubjects,
            },
            _editable: true,
            subjects: subjects,
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        expect(iScope.item[iScope.field].length).toBe(2);
        expect(iScope.terms.length).toBe(8);
        iScope.selectTerm(iScope.terms[0]);
        expect(iScope.item[iScope.field].length).toBe(3);
        expect(iScope.terms.length).toBe(7);
        expect(iScope.activeTree.length).toBe(2);
    }));

    it('open tree', inject(() => {
        var elmHtml = '<div sd-meta-terms ng-disabled="!_editable" ' +
                      'data-item="item" data-field="subjects" data-unique="qcode" ' +
                      'data-list="subjects" data-header="true" data-reload-list="true"></div>';

        var iScope;
        var scopeValues = {
            item: {
                subjects: itemSubjects,
            },
            _editable: true,
            subjects: subjects,
        };
        var event = {
            stopPropagation: function() { /* no-op */ },
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        iScope.openTree({name: 'test', qcode: '111'}, event);
        expect(iScope.item[iScope.field].length).toBe(2);
        expect(iScope.activeTree.length).toBe(3);
        expect(iScope.terms.length).toBe(8);
    }));
});

describe('dateline dropdown', () => {
    var $rootScope,
        $compile,
        cities;

    cities = [
        {
            alt_name: '',
            city: 'Katoomba',
            city_code: 'Katoomba',
            state: 'New South Wales',
            state_code: 'NSW',
            tz: 'Australia/Sydney',
            dateline: 'city',
            country: 'Australia',
            country_code: 'AU',
        },
        {
            alt_name: '',
            city: 'Sydney',
            city_code: 'Sydney',
            state: 'New South Wales',
            state_code: 'NSW',
            tz: 'Australia/Sydney',
            dateline: 'city',
            country: 'Australia',
            country_code: 'AU',
        },
    ];

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.publish'));
    beforeEach(window.module('superdesk.apps.authoring.metadata'));

    beforeEach(inject((_$rootScope_, _$compile_) => {
        $rootScope = _$rootScope_;
        $compile = _$compile_;
    }));

    function compileDirective(html, scopeValues) {
        var scope = $rootScope.$new();

        angular.extend(scope, scopeValues);
        return $compile(html)(scope);
    }

    it('select city within the list', inject(() => {
        var elmHtml = '<div sd-meta-locators class="dateline-city" ng-disabled="!_editable" ' +
                      'data-item="item" data-list="cities" data-fieldprefix="dateline" ' +
                      'data-field="located"></div>';

        var iScope;
        var scopeValues = {
            item: {
                dateline: {
                    located: {

                    },
                },
            },
            _editable: true,
            cities: cities,
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        iScope.$digest();
        iScope.searchLocator('Sydney');
        expect(iScope.selectedTerm).toBe('Sydney');
        iScope.selectLocator(cities[1]);
        expect(iScope.item.dateline.located.city).toBe('Sydney');
    }));

    it('select city not within the list', inject(() => {
        var elmHtml = '<div sd-meta-locators class="dateline-city" ng-disabled="!_editable" ' +
                      'data-item="item" data-list="cities" data-fieldprefix="dateline" ' +
                      'data-field="located"></div>';

        var iScope;
        var scopeValues = {
            item: {
                dateline: {
                    located: {

                    },
                },
            },
            _editable: true,
            cities: cities,
        };

        var elm = compileDirective(elmHtml, scopeValues);

        $rootScope.$digest();
        iScope = elm.isolateScope();
        iScope.$digest();
        iScope.searchLocator('Foobar');
        expect(iScope.selectedTerm).toBe('Foobar');
        iScope.selectLocator();
        expect(iScope.item.dateline.located.city).toBe('Foobar');
    }));
});
