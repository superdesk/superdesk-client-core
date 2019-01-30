import {gettext} from 'core/ui/components/utils';

describe('legal archive service', () => {
    beforeEach(window.module('superdesk.core.api'));
    beforeEach(window.module('superdesk.apps.legal_archive'));
    beforeEach(window.module('superdesk.apps.search'));

    /**
     * Mock some of the dependencies of the parent directives.
     */
    beforeEach(window.module(($provide) => {
        $provide.constant('config', {
            model: {
                timeformat: 'HH:mm:ss',
                dateformat: 'DD/MM/YYYY',
            },
            view: {
                timeformat: 'HH:mm',
                dateformat: 'MM/DD/YYYY',
            },
            defaultTimezone: 'UTC',
            server: {url: undefined},
        });
    }));

    it('can create base query', inject((legal) => {
        var criteria = legal.getCriteria();

        expect(criteria.sort).toEqual('[("versioncreated", -1)]');
        expect(criteria.max_results).toBe(25);
    }));

    it('can create query string query', inject(($rootScope, legal) => {
        legal.updateSearchQuery({headline: 'test'});
        $rootScope.$digest();
        var criteria = legal.getCriteria();

        expect(criteria.where).toBe('{"$and":[{"headline":{"$regex":"test","$options":"-i"}}]}');

        legal.updateSearchQuery({_id: '123', headline: 'test'});
        $rootScope.$digest();
        criteria = legal.getCriteria();
        expect(criteria.where).toBe(angular.toJson({$and: [
            {_id: '123'},
            {headline: {$regex: 'test', $options: '-i'}},
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
        /* jshint multistr: true */
        expect(criteria.where).toBe('{"$and":[' + [
            '{"_id":"123"}',
            '{"headline":{"$regex":"test","$options":"-i"}}',
            '{"versioncreated":{"$gte":"2015-06-16T00:00:00+0000"}}',
        ].join(',') + ']}');
    }));

    it('can sort items', inject((legal, sort, $location, $rootScope) => {
        var sortOptions = [
            {field: 'versioncreated', label: gettext('Updated')},
            {field: 'firstcreated', label: gettext('Created')},
            {field: 'urgency', label: gettext('Urgency')},
            {field: 'anpa_category.name', label: gettext('Category')},
            {field: 'slugline', label: gettext('Slugline')},
            {field: 'priority', label: gettext('Priority')},
        ];

        sort.setSort('urgency', sortOptions);
        $rootScope.$digest();
        expect($location.search().sort).toBe('urgency:desc');
        expect(legal.getCriteria().sort).toEqual('[("' + encodeURIComponent('urgency') + '", -1)]');

        sort.toggleSortDir(sortOptions);
        $rootScope.$digest();
        expect($location.search().sort).toBe('urgency:asc');
        expect(legal.getCriteria().sort).toEqual('[("' + encodeURIComponent('urgency') + '", 1)]');
    }));
});
