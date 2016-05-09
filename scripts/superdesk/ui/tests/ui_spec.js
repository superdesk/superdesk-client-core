
'use strict';

describe('superdesk ui', function() {

    beforeEach(module(function($provide) {
        $provide.constant('config', {
            model: {
                timeformat: 'HH:mm:ss',
                dateformat: 'DD/MM/YYYY'
            },
            view: {
                timeformat: 'HH:mm',
                dateformat: 'MM/DD/YYYY'
            },
            defaultTimezone: 'Europe/London',
            server: {url: undefined}
        });
    }));

    beforeEach(module('superdesk.ui'));
    beforeEach(module('superdesk.templates-cache'));

    var datetimeHelper;

    describe('datetimeHelper service', function () {
        beforeEach(inject(function (_datetimeHelper_) {
            datetimeHelper = _datetimeHelper_;
        }));

        it('should be defined', function () {
            expect(datetimeHelper).toBeDefined();
        });

        it('should validate time', function() {
            expect(datetimeHelper.isValidTime('15:14:13')).toBe(true);
            expect(datetimeHelper.isValidTime('00:00:00')).toBe(true);
            expect(datetimeHelper.isValidTime('23:00:11')).toBe(true);
            expect(datetimeHelper.isValidTime('15:14:')).toBe(false);
            expect(datetimeHelper.isValidTime('15:14')).toBe(false);
            expect(datetimeHelper.isValidTime('15:14:1o')).toBe(false);
            expect(datetimeHelper.isValidTime('24:01:15')).toBe(false);
        });

        it('should validate date', function() {
            expect(datetimeHelper.isValidDate('23/09/2015')).toBe(true);
            expect(datetimeHelper.isValidDate('23/09/15')).toBe(false);
            expect(datetimeHelper.isValidDate('23/O9/2015')).toBe(false);
            expect(datetimeHelper.isValidDate('09/23/2015')).toBe(false);
            expect(datetimeHelper.isValidDate('00/09/2015')).toBe(false);
            expect(datetimeHelper.isValidDate('01/01/2015')).toBe(true);
            expect(datetimeHelper.isValidDate('1/1/15')).toBe(false);
        });
    });

    describe('sdTimezone directive', function () {
        var fakeTzData,
            getTzDataDeferred,
            isoScope;  // the directive's isolate scope

        beforeEach(module('superdesk.ingest'));
        beforeEach(module(function($provide) {
            var childDirectives = [
                'sdWeekdayPicker', 'sdTimepickerAlt', 'sdTypeahead'
            ];

            fakeTzData = {
                $promise: null,
                zones: {},
                links: {}
            };
            $provide.constant('tzdata', fakeTzData);

            // Mock child directives to test the directive under test in
            // isolation, avoiding the need to create more complex fixtures
            // that satisfy any special child directives' requirements.
            childDirectives.forEach(function (directiveName) {
                // Internally, Angular appends the "Directive" suffix to
                // directive name, thus we need to do the same for mocking.
                directiveName += 'Directive';
                $provide.factory(directiveName, function () {
                    return {};
                });
            });
        }));

        beforeEach(inject(function ($compile, $rootScope, $q, tzdata) {
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
        }));

        it('initially clears the time zone search term', function () {
            expect(isoScope.tzSearchTerm).toEqual('');
        });

        it('initializes the list of matching time zones to an empty list',
            function () {
                expect(isoScope.matchingTimeZones).toEqual([]);
            }
        );

        it('initializes the list of all available time zones', function () {
            var serverTzData = {
                zones: {
                    'Europe/Rome': ['1 - CET'],
                    'Australia/Sydney': ['10 ADN EST']
                },
                links: {
                    'Foo/Bar': []
                }
            };
            fakeTzData.zones = serverTzData.zones;
            fakeTzData.links = serverTzData.links;
            fakeTzData.getTzNames = function () {
                return ['Australia/Sydney', 'Europe/Rome', 'Foo/Bar'];
            };

            isoScope.timeZones = [];

            getTzDataDeferred.resolve(serverTzData);
            isoScope.$digest();

            expect(isoScope.timeZones).toEqual(
                ['Australia/Sydney', 'Europe/Rome', 'Foo/Bar']
            );
        });

        it('applies the default timezone', inject(function ($compile, $rootScope, config) {
            var serverTzData = {
                zones: {
                    'Europe/Rome': ['1 - CET'],
                    'Australia/Sydney': ['10 ADN EST']
                },
                links: {
                    'Foo/Bar': []
                }
            };
            fakeTzData.zones = serverTzData.zones;
            fakeTzData.links = serverTzData.links;
            fakeTzData.getTzNames = function () {
                return ['Australia/Sydney', 'Europe/Rome', 'Foo/Bar'];
            };

            isoScope.timeZones = [];
            delete isoScope.timezone;
            config.defaultTimezone = 'Europe/Rome';

            getTzDataDeferred.resolve(serverTzData);
            isoScope.$digest();

            expect(isoScope.timeZones).toEqual(
                ['Australia/Sydney', 'Europe/Rome', 'Foo/Bar']
            );

            isoScope.$digest();

            expect(isoScope.timezone).toEqual('Europe/Rome');
        }));

        describe('scope\'s searchTimeZones() method', function () {
            it('sets the time zone search term to the given term ',
                function () {
                    isoScope.tzSearchTerm = 'foo';
                    isoScope.searchTimeZones('bar');
                    expect(isoScope.tzSearchTerm).toEqual('bar');
                }
            );

            it('sets the matching time zones to an empty list if given ' +
                'an empty search term',
                function () {
                    isoScope.matchingTimeZones = ['foo', 'bar'];
                    isoScope.searchTimeZones('');
                    expect(isoScope.matchingTimeZones).toEqual([]);
                }
            );

            it('sets the matching time zones to those matching the given ' +
                'search term',
                function () {
                    isoScope.timeZones = [
                        'Foo/City', 'Asia/FooBar', 'EU_f/oo', 'bar_fOo', 'xyz'
                    ];
                    isoScope.searchTimeZones('fOO');
                    expect(isoScope.matchingTimeZones).toEqual([
                        'Foo/City', 'Asia/FooBar', 'bar_fOo'
                    ]);
                }
            );
        });

        describe('scope\'s selectTimeZone() method', function () {
            it('sets the routing rule\'s time zone to the one given',
                function () {
                    isoScope.timezone = null;
                    isoScope.selectTimeZone('foo');
                    expect(isoScope.timezone).toEqual('foo');
                }
            );

            it('clears the time zone search term', function () {
                isoScope.tzSearchTerm = 'Europe';
                isoScope.selectTimeZone('foo');
                expect(isoScope.tzSearchTerm).toEqual('');
            });
        });

        describe('scope\'s clearSelectedTimeZone() method', function () {
            it('clears the time zone', function () {
                isoScope.timezone = 'foo';
                isoScope.clearSelectedTimeZone();
                expect(isoScope.timezone).not.toBeDefined();
            });
        });
    });

    describe('default ui config', function() {
        it('ui.italicAbstract is on', inject(function(config) {
            expect(config.ui).toBeDefined();
            expect(config.ui.italicAbstract).toBeTruthy();
        }));
    });
});
