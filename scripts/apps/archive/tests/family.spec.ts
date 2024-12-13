
describe('family service', () => {
    var items = [
        {unique_id: 1, _id: 'z', family_id: 'family1', task: {desk: 'desk1'}},
        {unique_id: 2, _id: 'x', family_id: 'family1', task: {desk: 'desk2'}},
        {unique_id: 3, _id: 'c', family_id: 'family2', task: {desk: 'desk3'}},
    ];
    var deskList = {
        desk1: {title: 'desk1'},
        desk3: {title: 'desk3'},
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
                userDesks: userDesks,
            }));
        }));

        beforeEach(inject((api, $q) => {
            spyOn(api, 'find').and.returnValue($q.reject({}));
            spyOn(api, 'query').and.callFake((endpoint, params) => {
                const familyId = params.source.query.filtered.filter.and[1].term.family_id;
                const members = _.filter(items, {family_id: familyId});

                if (params.source.query.filtered.filter.and[2]) {
                    _.remove(members,
                        {unique_id: params.source.query.filtered.filter.and[2].not.term.unique_id},
                    );
                }

                return $q.when({_items: members});
            });
        }));

        it('can fetch members of a family', (done) => inject(($rootScope, familyService, api) => {
            familyService.fetchItems('family1')
                .then((members) => {
                    expect(members._items.length).toBe(2);
                    done();
                });

            $rootScope.$digest();
        }));

        it('can fetch members of a family with exclusion', (done) => inject(($rootScope, familyService, api) => {
            familyService.fetchItems('family1', {unique_id: 1, _id: 'z'})
                .then((members) => {
                    expect(members._items.length).toBe(1);
                    done();
                });

            $rootScope.$digest();
        }));

        it('can fetch desks of members of a family', (done) => inject(($rootScope, familyService) => {
            familyService.fetchDesks({_id: 'z', family_id: 'family1'})
                .then((memberDesks) => {
                    expect(memberDesks.length).toBe(1);
                    done();
                });

            $rootScope.$digest();
        }));

        it('can determine weather a user is member of fetched desk',
            (done) => inject(($rootScope, familyService) => {
                familyService.fetchDesks({_id: 'z', family_id: 'family1', task: {desk: 'desk1'}})
                    .then((memberDesks) => {
                        expect(memberDesks.length).toBe(1);
                        expect(memberDesks[0].isUserDeskMember).toBe(true);
                        done();
                    });

                $rootScope.$digest();
            }));

        it('can fetch desks of members of a family with exclusion',
            (done) => inject(($rootScope, familyService) => {
                familyService.fetchDesks({unique_id: 1, _id: 'z', family_id: 'family1'}, true)
                    .then((memberDesks) => {
                        expect(memberDesks.length).toBe(0);
                        done();
                    });

                $rootScope.$digest();
            }));

        it('can use item._id for ingest items instead of family id',
            inject(($rootScope, $q, familyService) => {
                spyOn(familyService, 'fetchItems').and.returnValue($q.when({}));
                familyService.fetchDesks({_id: 'id', family_id: 'family_id', state: 'ingested'});
                expect(familyService.fetchItems).toHaveBeenCalledWith('id', undefined);
            }));
    });

    describe('fetching related items', () => {
        const item = {
            type: 'text',
            genre: [{qcode: 'Article'}],
            event_id: 1,
        };

        it('can query related items', (done) => inject(($rootScope, $q, familyService, api) => {
            const query = {
                repo: 'archive,published',
                source: {
                    query: {
                        filtered: {
                            filter: {
                                and: [
                                    {not: {term: {state: 'spiked'}}},
                                    {term: {event_id: 1}},
                                    {not: {term: {type: 'composite'}}},
                                ],
                            },
                        },
                    },
                    size: 200,
                    from: 0,
                    sort: {versioncreated: 'asc'},
                },
            };

            spyOn(api, 'query').and.returnValue($q.when());

            familyService.fetchRelatedItems({event_id: 1}).then(() => {
                expect(api.query).toHaveBeenCalledWith('search', query);
                done();
            });
            $rootScope.$digest();
        }));

        it('can query relatable items with empty match criteria',
            (done) => inject(($rootScope, $q, familyService, api) => {
                const query = {
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
                                        {term: {type: 'text'}},
                                    ],
                                },
                                query: {
                                    query_string: {query: 'slugline.phrase:("test")', lenient: true},
                                },
                            },
                        },
                        size: 200,
                        from: 0,
                        sort: {firstcreated: 'asc'},
                    },
                };

                spyOn(api, 'query').and.returnValue($q.when());

                familyService.fetchRelatableItems('test', '', item).then(() => {
                    expect(api.query).toHaveBeenCalledWith('search', query);
                    done();
                });

                $rootScope.$digest();
            }));

        it('can query relatable items with prefix criteria', (done) => inject(($rootScope, $q, familyService, api) => {
            const query = {
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
                                    {term: {type: 'text'}},
                                ],
                            },
                            query: {
                                match_phrase_prefix: {'slugline.phrase': 'test'},
                            },
                        },
                    },
                    size: 200,
                    from: 0,
                    sort: {firstcreated: 'asc'},
                },
            };

            spyOn(api, 'query').and.returnValue($q.when());

            familyService.fetchRelatableItems('test', 'PREFIX', item).then(() => {
                expect(api.query).toHaveBeenCalledWith('search', query);
                done();
            });

            $rootScope.$digest();
        }));

        it('can query relatable items with date range', (done) => inject(($rootScope, $q, familyService, api) => {
            const query = {
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
                                    {term: {type: 'text'}},
                                    {range: {versioncreated: {gte: '48-h'}}},
                                ],
                            },
                            query: {
                                match_phrase_prefix: {'slugline.phrase': 'test'},
                            },
                        },
                    },
                    size: 200,
                    from: 0,
                    sort: {firstcreated: 'asc'},
                },
            };

            spyOn(api, 'query').and.returnValue($q.when());

            familyService.fetchRelatableItems('test', 'PREFIX', item, '48-h').then(() => {
                expect(api.query).toHaveBeenCalledWith('search', query);
                done();
            });

            $rootScope.$digest();
        }));
    });
});
