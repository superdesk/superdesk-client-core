
describe('Content API Search', () => {
    beforeEach(window.module('superdesk.core.api'));
    beforeEach(window.module('superdesk.apps.content-api'));
    beforeEach(window.module('superdesk.apps.search'));

    /**
     * Mock some of the dependencies of the parent directives.
     */
    beforeEach(window.module(($provide) => {
        $provide.constant('config', {
            model: {
                timeformat: 'HH:mm:ss',
                dateformat: 'DD/MM/YYYY'
            },
            view: {
                timeformat: 'HH:mm',
                dateformat: 'MM/DD/YYYY'
            },
            search: {
                useDefaultTimezone: true
            },
            defaultTimezone: 'Europe/London',
            server: {url: undefined}
        });
    }));

    it('can create base query', inject((contentApiSearch) => {
        let criteria = contentApiSearch.getCriteria();

        expect(criteria.sort).toEqual('[("versioncreated", -1)]');
        expect(criteria.max_results).toBe(25);
    }));

    it('can sort items', inject((contentApiSearch, sort, $rootScope, $location) => {
        sort.setSort('urgency', contentApiSearch.sortOptions);
        $rootScope.$digest();
        expect($location.search().sort).toBe('urgency:desc');
        let criteria = contentApiSearch.getCriteria();

        expect(criteria.sort).toEqual('[("urgency", -1)]');
    }));

    it('can search by subscriber', inject((contentApiSearch) => {
        let criteria = contentApiSearch.getCriteria({subscriber: 'foo'});

        expect(criteria.subscribers).toEqual('foo');
    }));

    it('can search using q', inject((contentApiSearch) => {
        let criteria = contentApiSearch.getCriteria({q: 'foo bar'});

        expect(criteria.q).toEqual('foo bar');
        expect(criteria.default_operator).toEqual('AND');
    }));

    it('can search using category', inject((contentApiSearch) => {
        let criteria = contentApiSearch.getCriteria({category: '["foo"]'});

        expect(criteria.filter).toEqual('[{"terms":{"service.name":["foo"]}}]');
    }));

    it('can search using category', inject((contentApiSearch) => {
        let criteria = contentApiSearch.getCriteria({category: '["foo"]'});

        expect(criteria.filter).toEqual('[{"terms":{"service.name":["foo"]}}]');
    }));

    it('can search source', inject((contentApiSearch) => {
        let criteria = contentApiSearch.getCriteria({source: '["foo"]'});

        expect(criteria.filter).toEqual('[{"terms":{"source":["foo"]}}]');
    }));

    it('can search urgency and priority', inject((contentApiSearch) => {
        let criteria = contentApiSearch.getCriteria({urgency: '[1]', priority: '[1]'});

        expect(criteria.filter).toEqual('[{"terms":{"urgency":[1]}},{"terms":{"priority":[1]}}]');
    }));

    it('can search subject', inject((contentApiSearch) => {
        let criteria = contentApiSearch.getCriteria({subject: '["01000000"]'});
        let expected = '[{"or":[{"terms":{"subject.code":["01000000"]}},{"terms":{"subject.parent":["01000000"]}}]}]';

        expect(criteria.filter).toEqual(expected);
    }));

    it('can search by range filter', inject((contentApiSearch) => {
        let criteria = contentApiSearch.getCriteria({beforefirstcreated: '05/15/2017'});
        let expected = '[{"range":{"firstcreated":{"lte":"2017-05-15T23:59:59+0000"},"versioncreated":{}}}]';

        expect(criteria.filter).toEqual(expected);
    }));
});
