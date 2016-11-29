'use strict';

describe('itemListService', () => {
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.core.itemList'));
    beforeEach(window.module(($provide) => {
        $provide.service('api', ($q) => function ApiService(endpoint, endpointParam) {
            return {
                query: function(params) {
                    params._endpoint = endpoint;
                    params._endpointParam = endpointParam;
                    return $q.when(params);
                }
            };
        });
    }));

    it('can query with default values', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch()
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();
        expect(queryParams).toEqual({
            _endpoint: 'search',
            _endpointParam: undefined,
            source: {
                query: {
                    filtered: {}
                },
                size: 25,
                from: 0,
                sort: [{_updated: 'desc'}]
            }
        });
    }));

    it('can query with endpoint', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            endpoint: 'archive',
            endpointParam: 'param'
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();
        expect(queryParams._endpoint).toBe('archive');
        expect(queryParams._endpointParam).toBe('param');
    }));

    it('can query with page', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            pageSize: 15,
            page: 3
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();
        expect(queryParams.source.size).toBe(15);
        expect(queryParams.source.from).toBe(30);
    }));

    it('can query with sort', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            sortField: '_id',
            sortDirection: 'asc'
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();
        expect(queryParams.source.sort).toEqual([{_id: 'asc'}]);
    }));

    it('can query with repos', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            repos: ['archive', 'ingest']
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();
        expect(queryParams.repo).toBe('archive,ingest');
    }));

    it('can query with types', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            types: ['text', 'picture', 'composite']
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();
        expect(queryParams.source.query.filtered.filter.and[0].terms.type).toEqual(
            ['text', 'picture', 'composite']
        );
    }));

    it('can query with states', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            states: ['spiked', 'published']
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();
        expect(queryParams.source.query.filtered.filter.and[0].or).toEqual([
            {term: {state: 'spiked'}},
            {term: {state: 'published'}}
        ]);
    }));

    it('can query with notStates', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            notStates: ['spiked', 'published']
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();
        expect(queryParams.source.query.filtered.filter.and).toEqual([
            {not: {term: {state: 'spiked'}}},
            {not: {term: {state: 'published'}}}
        ]);
    }));

    it('can query with dates', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            creationDateBefore: 1,
            creationDateAfter: 2,
            modificationDateBefore: 3,
            modificationDateAfter: 4
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();
        expect(queryParams.source.query.filtered.filter.and).toEqual([
            {range: {_created: {lte: 1, gte: 2}}},
            {range: {versioncreated: {lte: 3, gte: 4}}}
        ]);
    }));

    it('can query with provider, source and urgency', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            provider: 'reuters',
            source: 'reuters_1',
            urgency: 5
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();
        expect(queryParams.source.query.filtered.filter.and).toEqual([
            {term: {provider: 'reuters'}},
            {term: {source: 'reuters_1'}},
            {term: {urgency: 5}}
        ]);
    }));

    it('can query with headline, subject, keyword, uniqueName and body search',
    inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            headline: 'h',
            subject: 's',
            keyword: 'k',
            uniqueName: 'u',
            body: 'b'
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();
        expect(queryParams.source.query.filtered.query).toEqual({
            query_string: {
                query: 'headline:(*h*) subject.name:(*s*) slugline:(*k*) unique_name:(*u*) body_html:(*b*)',
                lenient: false,
                default_operator: 'AND'
            }
        });
    }));

    it('can query with general search', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            search: 's'
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();
        expect(queryParams.source.query.filtered.query).toEqual({
            query_string: {
                query: 'headline:(*s*) subject.name:(*s*) slugline:(*s*) unique_name:(*s*) body_html:(*s*)',
                lenient: false,
                default_operator: 'OR'
            }
        });
    }));

    it('can query with saved search', inject(($rootScope, itemListService, api, $q, session) => {
        session.identity = {_id: 'foo'};
        var params;

        api.get = angular.noop;
        spyOn(api, 'get').and.returnValue($q.when({filter: {query: {type: '["text"]'}}}));
        itemListService.fetch({
            savedSearch: {_links: {self: {href: 'url'}}}
        }).then((_params) => {
            params = _params;
        });

        $rootScope.$digest();

        expect(params.source.post_filter.and).toContain({
            terms: {type: ['text']}
        });
    }));

    it('related items query without backslash and colon', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            keyword: 'kilo',
            related: true
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();

        expect(queryParams.source.query.filtered.query).toEqual({
            query_string: {
                query: 'slugline.phrase:("kilo")',
                lenient: false
            }
        });
    }));

    it('related items query with colon', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            keyword: 'kilo: gram:',
            related: true
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();

        expect(queryParams.source.query.filtered.query).toEqual({
            query_string: {
                query: 'slugline.phrase:("kilo gram")',
                lenient: false
            }
        });
    }));

    it('related items query with forwardslash', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            keyword: 'kilo/ gram/',
            related: true
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();

        expect(queryParams.source.query.filtered.query).toEqual({
            query_string: {
                query: 'slugline.phrase:("kilo\\/ gram\\/")',
                lenient: false
            }
        });
    }));

    it('related items query with backwardslash', inject(($rootScope, itemListService, api) => {
        var queryParams = null;

        itemListService.fetch({
            keyword: 'kilo\\ gram\\',
            related: true
        })
        .then((params) => {
            queryParams = params;
        });
        $rootScope.$digest();

        expect(queryParams.source.query.filtered.query).toEqual({
            query_string: {
                query: 'slugline.phrase:("kilo gram")',
                lenient: false
            }
        });
    }));
});
