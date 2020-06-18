import {appConfig} from 'appConfig';
import {ISuperdeskGlobalConfig} from 'superdesk-api';

describe('superdesk ui', () => {
    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            model: {
                timeformat: 'HH:mm:ss',
                dateformat: 'DD/MM/YYYY',
            },
            view: {
                timeformat: 'HH:mm',
                dateformat: 'MM/DD/YYYY',
            },
            defaultTimezone: 'Europe/London',
            server: {url: undefined, ws: undefined},
        };

        Object.assign(appConfig, testConfig);
    });

    beforeEach(window.module('superdesk.core.ui'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    var datetimeHelper;

    describe('datetimeHelper service', () => {
        beforeEach(inject((_datetimeHelper_) => {
            datetimeHelper = _datetimeHelper_;
        }));

        it('should be defined', () => {
            expect(datetimeHelper).toBeDefined();
        });

        it('should validate time', () => {
            expect(datetimeHelper.isValidTime('15:14:13')).toBe(true);
            expect(datetimeHelper.isValidTime('00:00:00')).toBe(true);
            expect(datetimeHelper.isValidTime('23:00:11')).toBe(true);
            expect(datetimeHelper.isValidTime('15:14:')).toBe(false);
            expect(datetimeHelper.isValidTime('15:14')).toBe(false);
            expect(datetimeHelper.isValidTime('15:14:1o')).toBe(false);
            expect(datetimeHelper.isValidTime('24:01:15')).toBe(false);
        });

        it('should validate date', () => {
            expect(datetimeHelper.isValidDate('23/09/2015')).toBe(true);
            expect(datetimeHelper.isValidDate('23/09/15')).toBe(false);
            expect(datetimeHelper.isValidDate('23/O9/2015')).toBe(false);
            expect(datetimeHelper.isValidDate('09/23/2015')).toBe(false);
            expect(datetimeHelper.isValidDate('00/09/2015')).toBe(false);
            expect(datetimeHelper.isValidDate('01/01/2015')).toBe(true);
            expect(datetimeHelper.isValidDate('1/1/15')).toBe(false);
        });
    });

    describe('sdTimezone directive', () => {
        var fakeTzData,
            getTzDataDeferred,
            isoScope; // the directive's isolate scope

        beforeEach(window.module('superdesk.apps.ingest'));
        beforeEach(window.module(($provide) => {
            var childDirectives = [
                'sdWeekdayPicker', 'sdTimepickerAlt', 'sdTypeahead',
            ];

            fakeTzData = {
                $promise: null,
                zones: {},
                links: {},
            };
            $provide.constant('tzdata', fakeTzData);

            // Mock child directives to test the directive under test in
            // isolation, avoiding the need to create more complex fixtures
            // that satisfy any special child directives' requirements.
            childDirectives.forEach((directiveName) => {
                // Internally, Angular appends the "Directive" suffix to
                // directive name, thus we need to do the same for mocking.
                $provide.factory(directiveName + 'Directive', () => ({}));
            });
        }));

        beforeEach(inject(($compile, $rootScope, $q, tzdata) => {
            var element,
                html = '<div sd-timezone data-timezone="timezone"></div>',
                scope;

            getTzDataDeferred = $q.defer();
            fakeTzData.$promise = getTzDataDeferred.promise;

            scope = $rootScope.$new();
            scope.timezone = {};

            element = $compile(html)(scope);
            scope.$digest();
            isoScope = element.isolateScope();
            isoScope.getTimezoneLabel = (tz) => tz;
        }));

        it('initially clears the time zone search term', () => {
            expect(isoScope.tzSearchTerm).toEqual('');
        });

        it('initializes the list of matching time zones to an empty list',
            () => {
                expect(isoScope.matchingTimeZones).toEqual([]);
            },
        );

        it('initializes the list of all available time zones', () => {
            var serverTzData = {
                zones: {
                    'Europe/Rome': ['1 - CET'],
                    'Australia/Sydney': ['10 ADN EST'],
                },
                links: {
                    'Foo/Bar': [],
                },
            };

            fakeTzData.zones = serverTzData.zones;
            fakeTzData.links = serverTzData.links;
            fakeTzData.getTzNames = function() {
                return ['Australia/Sydney', 'Europe/Rome', 'Foo/Bar'];
            };

            isoScope.timeZones = [];

            getTzDataDeferred.resolve(serverTzData);
            isoScope.$digest();

            expect(isoScope.timeZones).toEqual(
                ['Australia/Sydney', 'Europe/Rome', 'Foo/Bar'],
            );
        });

        it('applies the default timezone', () => {
            var serverTzData = {
                zones: {
                    'Europe/Rome': ['1 - CET'],
                    'Australia/Sydney': ['10 ADN EST'],
                },
                links: {
                    'Foo/Bar': [],
                },
            };

            fakeTzData.zones = serverTzData.zones;
            fakeTzData.links = serverTzData.links;
            fakeTzData.getTzNames = function() {
                return ['Australia/Sydney', 'Europe/Rome', 'Foo/Bar'];
            };

            isoScope.timeZones = [];
            delete isoScope.timezone;
            appConfig.defaultTimezone = 'Europe/Rome';

            getTzDataDeferred.resolve(serverTzData);
            isoScope.$digest();

            expect(isoScope.timeZones).toEqual(
                ['Australia/Sydney', 'Europe/Rome', 'Foo/Bar'],
            );

            isoScope.$digest();

            expect(isoScope.timezone).toEqual('Europe/Rome');
        });

        describe('scope\'s searchTimeZones() method', () => {
            it('sets the time zone search term to the given term ',
                () => {
                    isoScope.tzSearchTerm = 'foo';
                    isoScope.searchTimeZones('bar');
                    expect(isoScope.tzSearchTerm).toEqual('bar');
                },
            );

            it('sets the matching time zones to an empty list if given ' +
                'an empty search term',
            () => {
                isoScope.matchingTimeZones = ['foo', 'bar'];
                isoScope.searchTimeZones('');
                expect(isoScope.matchingTimeZones).toEqual([]);
            },
            );

            it('sets the matching time zones to those matching the given ' +
                'search term',
            () => {
                isoScope.timeZones = [
                    'Foo/City', 'Asia/FooBar', 'EU_f/oo', 'bar_fOo', 'xyz',
                ];
                isoScope.searchTimeZones('fOO');
                expect(isoScope.matchingTimeZones).toEqual([
                    'Foo/City', 'Asia/FooBar', 'bar_fOo',
                ]);
            },
            );
        });

        describe('scope\'s selectTimeZone() method', () => {
            it('sets the routing rule\'s time zone to the one given',
                () => {
                    isoScope.timezone = null;
                    isoScope.selectTimeZone('foo');
                    expect(isoScope.timezone).toEqual('foo');
                },
            );

            it('clears the time zone search term', () => {
                isoScope.tzSearchTerm = 'Europe';
                isoScope.selectTimeZone('foo');
                expect(isoScope.tzSearchTerm).toEqual('');
            });
        });

        describe('scope\'s clearSelectedTimeZone() method', () => {
            it('clears the time zone', () => {
                isoScope.timezone = 'foo';
                isoScope.clearSelectedTimeZone();
                expect(isoScope.timezone).not.toBeDefined();
            });
        });
    });

    describe('default ui config', () => {
        it('ui.italicAbstract is on', () => {
            expect(appConfig.ui).toBeDefined();
            expect(appConfig.ui.italicAbstract).toBeTruthy();
        });
    });

    describe('multiple emails', () => {
        var scope, form, html;

        html = '<form name="form">' +
                    '<input type="text" name="email" ng-model="model.email" required sd-multiple-emails> ' +
               '</form>';
        beforeEach(inject(($compile, $rootScope) => {
            scope = $rootScope.$new();
            scope.model = {email: null};
            $compile(html)(scope);
            scope.$digest();
            form = scope.form;
        }));

        it('validates single email address', () => {
            form.email.$setViewValue('test@test.com');
            scope.$digest();
            expect(scope.model.email).toEqual('test@test.com');
            expect(form.email.$valid).toBe(true);
        });

        it('validates multiple email address', () => {
            form.email.$setViewValue('test@test.com,test@test.com');
            scope.$digest();
            expect(scope.model.email).toEqual('test@test.com,test@test.com');
            expect(form.email.$valid).toBe(true);
        });

        it('should not validate if one of the email address is wrong', () => {
            form.email.$setViewValue('test@test.com,test');
            scope.$digest();
            expect(form.email.$valid).toBe(false);
            expect(scope.model.email).toBe(undefined);
        });
    });

    describe('filesize filter', () => {
        it('can format bytes', inject(($filter) => {
            const filesize = $filter('filesize');

            expect(filesize(0)).toBe('0 b');
            expect(filesize(1024)).toBe('1.0 kB');
            expect(filesize(1024 * 1.3)).toBe('1.3 kB');
            expect(filesize(1024 * 1024)).toBe('1.0 MB');
            expect(filesize(1024 * 1024 * 5)).toBe('5.0 MB');
        }));
    });

    describe('fileicon filter', () => {
        it('can get file icon', inject(($filter) => {
            const filetype = $filter('fileicon');

            expect(filetype('image/jpeg')).toBe('document-default');
            expect(filetype('application/pdf')).toBe('document-pdf');
            expect(filetype('application/msword')).toBe('document-doc');
            expect(filetype('application/msexcel')).toBe('document-doc');
        }));
    });
});
