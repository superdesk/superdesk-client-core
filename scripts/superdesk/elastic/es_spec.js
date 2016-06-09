'use strict';

describe('elastic query builder', function() {

    beforeEach(module('superdesk.elastic'));

    it('generates query string query for q param', inject(function(es) {
        var body = es({q: 'test'});
        expect(body.query.bool.must.query_string.query).toBe('test');
        expect(body.from).toBe(0);
        expect(body.size).toBe(25);
    }));

    it('generates bool query for empty q param', inject(function(es) {
        var body = es({});
        expect(body.query).toEqual({bool: {}});
    }));

    it('generates bool query when using filter', inject(function(es) {
        var filters = [
            {term: {type: 'picture'}},
            {term: {provider: 'foo'}}
        ];

        var body = es({}, filters);
        expect(body.query.bool.must).toBe(undefined);
        expect(body.query.bool.filter.bool.must.length).toBe(2);
    }));

    it('does pagination', inject(function(es) {
        var body = es({page: 2});
        expect(body.from).toBe(25);
    }));
});
