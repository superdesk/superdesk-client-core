'use strict';

describe('legal archive service', function() {
    beforeEach(window.module('superdesk.core.api'));
    beforeEach(window.module('superdesk.apps.legal_archive'));

    /**
     * Mock some of the dependencies of the parent directives.
     */
    beforeEach(window.module(function($provide) {
        $provide.constant('config', {
            model: {
                timeformat: 'HH:mm:ss',
                dateformat: 'DD/MM/YYYY'
            },
            view: {
                timeformat: 'HH:mm',
                dateformat: 'MM/DD/YYYY'
            },
            defaultTimezone: 'UTC',
            server: {url: undefined}
        });
    }));

    it('can create base query', inject(function(legal) {
        var criteria = legal.getCriteria();
        expect(criteria.sort).toEqual('[("versioncreated", -1)]');
        expect(criteria.max_results).toBe(25);
    }));

    it('can create query string query', inject(function($rootScope, legal) {
        legal.updateSearchQuery({headline: 'test'});
        $rootScope.$digest();
        var criteria = legal.getCriteria();
        expect(criteria.where).toBe('{"$and":[{"headline":{"$regex":"test","$options":"-i"}}]}');

        legal.updateSearchQuery({_id: '123', headline: 'test'});
        $rootScope.$digest();
        criteria = legal.getCriteria();
        expect(criteria.where).toBe(angular.toJson({$and: [
            {_id: '123'},
            {headline: {$regex: 'test', $options: '-i'}}
        ]}));

        legal.updateSearchQuery({published_after: '06/16/2015'});
        $rootScope.$digest();
        criteria = legal.getCriteria();
        expect(criteria.where).toBe('{"$and":[{"versioncreated":{"$gte":"2015-06-16T00:00:00+0000"}}]}');

        legal.updateSearchQuery({published_before: '05/16/2015'});
        $rootScope.$digest();
        criteria = legal.getCriteria();
        expect(criteria.where).toBe('{"$and":[{"versioncreated":{"$lte":"2015-05-16T23:59:59+0000"}}]}');

        legal.updateSearchQuery({_id: '123', headline: 'test', published_after: '06/16/2015'});
        $rootScope.$digest();
        criteria = legal.getCriteria();
        /*jshint multistr: true */
        expect(criteria.where).toBe('{"$and":[' + [
            '{"_id":"123"}',
            '{"headline":{"$regex":"test","$options":"-i"}}',
            '{"versioncreated":{"$gte":"2015-06-16T00:00:00+0000"}}'
        ].join(',') + ']}');
    }));

    it('can sort items', inject(function(legal, $location, $rootScope) {
        legal.setSort('urgency');
        $rootScope.$digest();
        expect($location.search().sort).toBe('urgency:desc');
        expect(legal.getSort()).toEqual({label: 'Urgency', field: 'urgency', dir: 'desc'});

        legal.toggleSortDir();
        $rootScope.$digest();
        expect(legal.getSort()).toEqual({label: 'Urgency', field: 'urgency', dir: 'asc'});
    }));
});
