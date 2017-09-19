

describe('family service', () => {
    var items = [
        {unique_id: 1, _id: 'z', family_id: 'family1', task: {desk: 'desk1'}},
        {unique_id: 2, _id: 'x', family_id: 'family1', task: {desk: 'desk2'}},
        {unique_id: 3, _id: 'c', family_id: 'family2', task: {desk: 'desk3'}}
    ];
    var deskList = {
        desk1: {title: 'desk1'},
        desk3: {title: 'desk3'}
    };

    var userDesks = [{_id: 'desk1'}];

    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.archive.directives'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    describe('fetching family items', () => {
        beforeEach(window.module(($provide) => {
            $provide.service('desks', () => ({
                deskLookup: deskList,
                userDesks: userDesks
            }));
        }));

        beforeEach(inject((api, $q) => {
            spyOn(api, 'find').and.returnValue($q.reject({}));
            spyOn(api, 'query').and.callFake((endpoint, params) => {
                let familyId = params.source.query.filtered.filter.and[1].term.family_id;
                let members = _.filter(items, {family_id: familyId});

                if (params.source.query.filtered.filter.and[2]) {
                    _.remove(members,
                        {unique_id: params.source.query.filtered.filter.and[2].not.term.unique_id}
                    );
                }

                return $q.when({_items: members});
            });
        }));

        it('can fetch members of a family', inject(($rootScope, familyService, api) => {
            let members = null;

            familyService.fetchItems('family1')
                .then((result) => {
                    members = result;
                });
            $rootScope.$digest();
            expect(members._items.length).toBe(2);
        }));

        it('can fetch members of a family with exclusion', inject(($rootScope, familyService, api) => {
            let members = null;

            familyService.fetchItems('family1', {unique_id: 1, _id: 'z'})
                .then((result) => {
                    members = result;
                });
            $rootScope.$digest();
            expect(members._items.length).toBe(1);
        }));

        it('can fetch desks of members of a family', inject(($rootScope, familyService, api, desks) => {
            let memberDesks = null;

            familyService.fetchDesks({_id: 'z', family_id: 'family1'})
                .then((result) => {
                    memberDesks = result;
                });
            $rootScope.$digest();
            expect(memberDesks.length).toBe(1);
        }));

        it('can determine weather a user is member of fetched desk',
            inject(($rootScope, familyService, api, desks) => {
                let memberDesks = null;

                familyService.fetchDesks({_id: 'z', family_id: 'family1', task: {desk: 'desk1'}})
                    .then((result) => {
                        memberDesks = result;
                    });
                $rootScope.$digest();
                expect(memberDesks.length).toBe(1);
                expect(memberDesks[0].isUserDeskMember).toBe(true);
            }));

        it('can fetch desks of members of a family with exclusion',
            inject(($rootScope, familyService, api, desks) => {
                let memberDesks = null;

                familyService.fetchDesks({unique_id: 1, _id: 'z', family_id: 'family1'}, true)
                    .then((result) => {
                        memberDesks = result;
                    });
                $rootScope.$digest();
                expect(memberDesks.length).toBe(0);
            }));

        it('can use item._id for ingest items instead of family id',
            inject(($rootScope, $q, familyService) => {
                spyOn(familyService, 'fetchItems').and.returnValue($q.when({}));
                familyService.fetchDesks({_id: 'id', family_id: 'family_id', state: 'ingested'});
                expect(familyService.fetchItems).toHaveBeenCalledWith('id', undefined);
            }));
    });

    describe('fetching related items', () => {
        it('can query related items', inject(($rootScope, $q, familyService, api) => {
            let query = {
                repo: 'archive,published',
                source: {
                    query: {
                        filtered: {
                            filter: {
                                and: [
                                    {not: {term: {state: 'spiked'}}},
                                    {term: {event_id: 1}},
                                    {not: {term: {type: 'composite'}}}
                                ]
                            }
                        }
                    },
                    size: 200,
                    from: 0,
                    sort: {versioncreated: 'asc'}
                }
            };

            spyOn(api, 'query').and.returnValue($q.when());
            familyService.fetchRelatedItems({event_id: 1}).then();
            $rootScope.$digest();
            expect(api.query).toHaveBeenCalledWith('search', query);
        }));

        it('can query relatable items with empty match criteria', inject(($rootScope, $q, familyService, api) => {
            let query = {
                repo: 'archive,published',
                source: {
                    query: {
                        filtered: {
                            filter: {
                                and: [
                                    {not: {term: {state: 'spiked'}}},
                                    {not: {term: {event_id: 1}}},
                                    {not: {term: {type: 'composite'}}},
                                    {not: {term: {last_published_version: 'false'}}}
                                ]
                            },
                            query: {
                                query_string: {query: 'slugline.phrase:("test")', lenient: false}
                            }
                        }
                    },
                    size: 200,
                    from: 0,
                    sort: {firstcreated: 'asc'}
                }
            };

            spyOn(api, 'query').and.returnValue($q.when());
            familyService.fetchRelatableItems('test', '', 1).then();
            $rootScope.$digest();
            expect(api.query).toHaveBeenCalledWith('search', query);
        }));

        it('can query relatable items with prefix criteria', inject(($rootScope, $q, familyService, api) => {
            let query = {
                repo: 'archive,published',
                source: {
                    query: {
                        filtered: {
                            filter: {
                                and: [
                                    {not: {term: {state: 'spiked'}}},
                                    {not: {term: {event_id: 1}}},
                                    {not: {term: {type: 'composite'}}},
                                    {not: {term: {last_published_version: 'false'}}}
                                ]
                            },
                            query: {
                                match_phrase_prefix: {'slugline.phrase': 'test'}
                            }
                        }
                    },
                    size: 200,
                    from: 0,
                    sort: {firstcreated: 'asc'}
                }
            };

            spyOn(api, 'query').and.returnValue($q.when());
            familyService.fetchRelatableItems('test', 'PREFIX', 1).then();
            $rootScope.$digest();
            expect(api.query).toHaveBeenCalledWith('search', query);
        }));

        it('can query relatable items with date range', inject(($rootScope, $q, familyService, api) => {
            let query = {
                repo: 'archive,published',
                source: {
                    query: {
                        filtered: {
                            filter: {
                                and: [
                                    {not: {term: {state: 'spiked'}}},
                                    {not: {term: {event_id: 1}}},
                                    {not: {term: {type: 'composite'}}},
                                    {not: {term: {last_published_version: 'false'}}},
                                    {range: {versioncreated: {gte: '48-h'}}}
                                ]
                            },
                            query: {
                                match_phrase_prefix: {'slugline.phrase': 'test'}
                            }
                        }
                    },
                    size: 200,
                    from: 0,
                    sort: {firstcreated: 'asc'}
                }
            };

            spyOn(api, 'query').and.returnValue($q.when());
            familyService.fetchRelatableItems('test', 'PREFIX', 1, '48-h').then();
            $rootScope.$digest();
            expect(api.query).toHaveBeenCalledWith('search', query);
        }));
    });
});
