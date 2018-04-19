
/**
* Module with tests for the tzdata factory
*
* @module tzdata factory tests
*/
describe('tzdata factory', () => {
    var tzdata,
        $httpBackend,
        $rootScope;

    beforeEach(window.module('superdesk.apps.dashboard.world-clock'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(inject((_$httpBackend_, _$rootScope_, _tzdata_) => {
        tzdata = _tzdata_;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
    }));

    it('requests correct time zone data from the server', () => {
        var expectedUrl = new RegExp(
            'apps/dashboard/world-clock/timezones-all.json$');

        $httpBackend.expectGET(expectedUrl).respond({zones: {}, rules: {}});
        $rootScope.$digest();

        $httpBackend.verifyNoOutstandingExpectation();
    });

    it('stores fetched timezone data on sucess response', () => {
        var response = {
            zones: {
                'Europe/Rome': ['1 - CET'],
                'Australia/Sydney': ['10 ADN EST'],
            },
            links: {
                'Foo/Bar': [],
            },
        };

        tzdata.zones = null;
        tzdata.links = null;
        $httpBackend.whenGET(/.+/).respond(response);

        $httpBackend.flush();
        $rootScope.$digest();

        expect(tzdata.zones).toEqual(response.zones);
        expect(tzdata.links).toEqual(response.links);
    });

    describe('getTzNames() method', () => {
        it('returns an empty list if the data has not been fetched yet',
            () => {
                var result,
                    serverResponse;

                serverResponse = {
                    zones: {
                        'Europe/Rome': ['1 - CET'],
                        'Australia/Sydney': ['10 ADN EST'],
                        'Pacific/Auckland': ['13 NZDT'],
                    },
                    links: {
                        'Foo/Bar': [],
                    },
                };
                $httpBackend.whenGET(/.+/).respond(serverResponse);

                // NOTE: no .flush(), simulate no response from the server yet

                result = tzdata.getTzNames();
                expect(result).toEqual([]);
            }
        );

        it('returns a sorted list of available time zone names', () => {
            var result,
                serverResponse;

            serverResponse = {
                zones: {
                    'Europe/Rome': ['1 - CET'],
                    'Australia/Sydney': ['10 ADN EST'],
                    'Pacific/Auckland': ['13 NZDT'],
                },
                links: {
                    'Foo/Bar': [],
                },
            };
            $httpBackend.whenGET(/.+/).respond(serverResponse);

            $httpBackend.flush();
            $rootScope.$digest();

            result = tzdata.getTzNames();
            expect(result).toEqual([
                'Australia/Sydney', 'Europe/Rome',
                'Foo/Bar', 'Pacific/Auckland',
            ]);
        });
    });
});
