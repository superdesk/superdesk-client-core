

describe('Tag Service', () => {
    var deskList = {
        123: {_id: '123', name: 'desk1'},
        456: {_id: '456', name: 'desk2'}
    };

    var fakeMetadata;

    beforeEach(window.module('superdesk.apps.search'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.ingest'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.apps.publish'));

    /**
     * Mock some of the dependencies of the parent directives.
     */
    beforeEach(window.module(($provide) => {
        fakeMetadata = {
            values: {subjectcodes: []},
            fetchSubjectcodes: jasmine.createSpy()
        };

        $provide.value('metadata', fakeMetadata);
    }));

    beforeEach(inject(($q, subscribersService) => {
        fakeMetadata.fetchSubjectcodes.and.returnValue($q.when());
        spyOn(subscribersService, 'initialize').and.returnValue($q.when());
    }));

    it('can populate keywords from location', inject(($location, tags, $rootScope, desks, $q) => {
        var members = null;

        $location.search('q=(Obama)');
        $rootScope.$apply();

        spyOn(desks, 'initialize').and.returnValue($q.when({deskLookup: deskList}));

        tags.initSelectedFacets()
            .then((currentTags) => {
                members = currentTags;
            });

        $rootScope.$digest();
        expect(members.selectedKeywords.length).toBe(1);
    }));

    it('can populate parameters from location',
        inject(($location, tags, $rootScope, desks, $q, gettextCatalog) => {
            var members = null;

            $location.search('q=headline:(Obama)');
            $rootScope.$apply();

            spyOn(desks, 'initialize').and.returnValue($q.when({deskLookup: deskList}));
            gettextCatalog.setStrings(gettextCatalog.getCurrentLanguage(), {headline: 'foo'});

            tags.initSelectedFacets()
                .then((currentTags) => {
                    members = currentTags;
                });

            $rootScope.$digest();
            expect(members.selectedParameters.length).toBe(1);
            expect(members.selectedParameters[0].label).toBe('foo:(Obama)');
            expect(members.selectedParameters[0].value).toBe('headline:(Obama)');
        }));

    it('can populate type facet from location', inject(($location, tags, $rootScope, desks, $q) => {
        var members = null;

        $location.search('type=["text"]');
        $rootScope.$apply();

        spyOn(desks, 'initialize').and.returnValue($q.when({deskLookup: deskList}));

        tags.initSelectedFacets()
            .then((currentTags) => {
                members = currentTags;
            });

        $rootScope.$digest();
        expect(members.selectedFacets.type.length).toBe(1);
    }));

    it('can populate date facet from location', inject(($location, tags, $rootScope, desks, $q) => {
        var members = null;

        $location.search('after=now-1M');
        $rootScope.$apply();

        spyOn(desks, 'initialize').and.returnValue($q.when({deskLookup: deskList}));

        tags.initSelectedFacets()
            .then((currentTags) => {
                members = currentTags;
            });

        $rootScope.$digest();
        expect(members.selectedFacets.date.length).toBe(1);
        expect(members.selectedFacets.date[0]).toBe('Last Month');
    }));

    it('can populate complete filters from location', inject(($location, tags, $rootScope, desks, $q) => {
        var members = null;

        $location.search([
            'type=["text","composite"]',
            'q=slugline:(FBI) (Obama) (Australia)'
        ].join('&'));
        $rootScope.$apply();

        spyOn(desks, 'initialize').and.returnValue($q.when({deskLookup: deskList}));

        tags.initSelectedFacets()
            .then((currentTags) => {
                members = currentTags;
            });

        $rootScope.$digest();
        expect(members.selectedFacets.type.length).toBe(2);
        expect(members.selectedKeywords.length).toBe(3);
        expect(members.selectedParameters.length).toBe(1);
    }));

    it('create tags for from desk and to desk', inject(($location, $rootScope, $q, tags, _desks_) => {
        var desks = _desks_;

        desks.deskLookup = {
            from: {
                name: 'National'
            },
            to: {
                name: 'Sport'
            }
        };

        $location.search('from_desk', 'from-authoring');
        $location.search('to_desk', 'to-authoring');

        spyOn(desks, 'initialize').and.returnValue($q.when([]));

        var tagsList = null;

        tags.initSelectedFacets()
            .then((value) => {
                tagsList = value;
            });

        $rootScope.$digest();
        expect(tagsList.selectedParameters.length).toEqual(2);
        expect(tagsList.selectedParameters[0].label).toEqual('From Desk:National');
        expect(tagsList.selectedParameters[1].label).toEqual('To Desk:Sport');
    }));

    it('create tags original creator', inject(($location, $rootScope, $q, tags, desks, _userList_) => {
        var userList = _userList_;

        $location.search('original_creator', '123');

        var user = {
            _id: '123',
            display_name: 'Test User'
        };

        spyOn(userList, 'getUser').and.returnValue($q.when(user));
        spyOn(desks, 'initialize').and.returnValue($q.when({deskLookup: deskList}));

        var tagsList = null;

        tags.initSelectedFacets()
            .then((value) => {
                tagsList = value;
            });

        $rootScope.$digest();
        expect(tagsList.selectedParameters.length).toEqual(1);
        expect(tagsList.selectedParameters[0].label).toEqual('Creator:Test User');
    }));

    it('create tags if creator is not known', inject(($location, $rootScope, $q, tags, desks, _userList_) => {
        var userList = _userList_;

        $location.search('original_creator', '123');

        spyOn(userList, 'getUser').and.returnValue($q.reject({}));
        spyOn(desks, 'initialize').and.returnValue($q.when({deskLookup: deskList}));

        var tagsList = null;

        tags.initSelectedFacets()
            .then((value) => {
                tagsList = value;
            });

        $rootScope.$digest();
        expect(tagsList.selectedParameters.length).toEqual(1);
        expect(tagsList.selectedParameters[0].label).toEqual('Creator:Unknown');
    }));

    it('create tags for unique name', inject(($location, $rootScope, $q, tags, desks) => {
        $location.search('unique_name', '123');

        spyOn(desks, 'initialize').and.returnValue($q.when({deskLookup: deskList}));

        var tagsList = null;

        tags.initSelectedFacets()
            .then((value) => {
                tagsList = value;
            });

        $rootScope.$digest();
        expect(tagsList.selectedParameters.length).toEqual(1);
        expect(tagsList.selectedParameters[0].label).toEqual('Unique Name:123');
    }));

    it('create tags for ingest provider', inject(($location, $rootScope, $q, tags, desks, ingestSources) => {
        var providers = [{
            name: 'Test Provider',
            _id: 123
        }];

        ingestSources.providersLookup = _.keyBy(providers, '_id');
        spyOn(desks, 'initialize').and.returnValue($q.when({deskLookup: deskList}));
        $location.search('ingest_provider', '123');

        var tagsList = null;

        tags.initSelectedFacets()
            .then((value) => {
                tagsList = value;
            });

        $rootScope.$digest();
        expect(tagsList.selectedParameters.length).toEqual(1);
        expect(tagsList.selectedParameters[0]).toEqual(
            {label: 'Provider:Test Provider', value: 'Provider:Test Provider'}
        );
    }));

    it('create tags for remove source facet', inject(($location, $rootScope, $q, tags, desks) => {
        spyOn(desks, 'initialize').and.returnValue($q.when({deskLookup: deskList}));
        $location.search('notsource', '["REUTERS", "NTB"]');

        var tagsList = null;

        tags.initSelectedFacets()
            .then((value) => {
                tagsList = value;
            });

        $rootScope.$digest();
        expect(tagsList.removedFacets.notsource.length).toEqual(2);
        expect(tagsList.removedFacets.notsource).toEqual([
            {label: 'Not Source', displayValue: 'REUTERS', value: 'REUTERS'},
            {label: 'Not Source', displayValue: 'NTB', value: 'NTB'}
        ]);
    }));

    it('create tags for remove desk facet', inject(($location, $rootScope, $q, tags, desks) => {
        spyOn(desks, 'initialize').and.returnValue($q.when({}));
        $location.search('notdesk', '["123"]');
        desks.deskLookup = deskList;
        var tagsList = null;

        tags.initSelectedFacets()
            .then((value) => {
                tagsList = value;
            });

        $rootScope.$digest();
        expect(tagsList.removedFacets.notdesk.length).toEqual(1);
        expect(tagsList.removedFacets.notdesk[0]).toEqual(
            {label: 'Not Desk', displayValue: 'desk1', value: '123'}
        );
    }));

    it('create tags for remove category facet', inject(($location, $rootScope, $q, tags, desks) => {
        spyOn(desks, 'initialize').and.returnValue($q.when({deskLookup: deskList}));
        $location.search('notcategory', '["International Sports", "Domestic Sports"]');

        var tagsList = null;

        tags.initSelectedFacets()
            .then((value) => {
                tagsList = value;
            });

        $rootScope.$digest();
        expect(tagsList.removedFacets.notcategory.length).toEqual(2);
        expect(tagsList.removedFacets.notcategory).toEqual([
            {label: 'Not Category', displayValue: 'International Sports', value: 'International Sports'},
            {label: 'Not Category', displayValue: 'Domestic Sports', value: 'Domestic Sports'}
        ]);
    }));

    it('create tags for remove urgency facet', inject(($location, $rootScope, $q, tags, desks) => {
        spyOn(desks, 'initialize').and.returnValue($q.when({deskLookup: deskList}));
        $location.search('noturgency', '["1", "2"]');

        var tagsList = null;

        tags.initSelectedFacets()
            .then((value) => {
                tagsList = value;
            });

        $rootScope.$digest();
        expect(tagsList.removedFacets.noturgency.length).toEqual(2);
        expect(tagsList.removedFacets.noturgency).toEqual([
            {label: 'Not Urgency', displayValue: '1', value: '1'},
            {label: 'Not Urgency', displayValue: '2', value: '2'}
        ]);
    }));
});
