import {gettext} from 'core/ui/components/utils';

/**
 * @ngdoc service
 * @module superdesk.apps.legal_archive
 * @name legal
 * @requires api
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @requires config
 * @requires moment
 * @requires sort
 *
 * @description Handles retrieval of data from legal archive
 */
LegalArchiveService.$inject = ['api', '$location', 'config', 'moment', 'sort'];
export function LegalArchiveService(api, $location, config, moment, sortService) {
    var DEFAULT_PER_PAGE = 25;

    this.default_items = Object.freeze({_meta: {max_results: DEFAULT_PER_PAGE, page: 1, total: 1}});

    var sortOptions = [
        {field: 'versioncreated', label: gettext('Updated')},
        {field: 'firstcreated', label: gettext('Created')},
        {field: 'urgency', label: gettext('Urgency')},
        {field: 'anpa_category.name', label: gettext('Category')},
        {field: 'slugline', label: gettext('Slugline')},
        {field: 'priority', label: gettext('Priority')},
    ];

    sortService.setSort('versioncreated', sortOptions);
    this.sortOptions = sortOptions;

    this.getCriteria = function() {
        var params = $location.search(),
            criteria = {
                max_results: Number(params.max_results) || DEFAULT_PER_PAGE,
            };

        if (params.q) {
            criteria.where = params.q;
        }

        if (params.page) {
            criteria.page = parseInt(params.page, 10);
        }

        if (params.sort) {
            var sort = params.sort.split(':');

            criteria.sort = sortService.formatSort(sort[0], sort[1]);
        } else {
            criteria.sort = sortService.formatSort('versioncreated', 'desc');
        }

        return criteria;
    };

    this.updateSearchQuery = function updateSearchQuery(search) {
        var where = [];

        function prepareDate(val, timeSuffix) {
            var local = moment(val, config.view.dateformat).format('YYYY-MM-DD') + timeSuffix +
            moment.tz(config.defaultTimezone).format('ZZ');

            return moment(local, 'YYYY-MM-DDTHH:mm:ssZZ').utc()
                .format('YYYY-MM-DDTHH:mm:ssZZ');
        }

        var hasId = false;

        _.forEach(search, (n, key) => {
            var val = _.trim(n);

            if (val) {
                var clause = {};

                if (key === 'published_after') {
                    clause.versioncreated = {$gte: prepareDate(val, 'T00:00:00')};
                } else if (key === 'published_before') {
                    clause.versioncreated = {$lte: prepareDate(val, 'T23:59:59')};
                } else if (key === '_id') {
                    clause._id = val;
                    hasId = true;
                } else {
                    clause[key] = {$regex: val, $options: '-i'};
                }
                where.push(clause);
            }
        });

        var whereClause = null;

        if (hasId && where.length === 1) {
            whereClause = JSON.stringify(where[0]);
        } else if (where.length > 0) {
            whereClause = JSON.stringify({
                $and: where,
            });
        }

        $location.search('q', whereClause);
        return whereClause;
    };

    // query public api
    this.query = function query() {
        var searchCriteria = this.getCriteria();

        return api.legal_archive.query(searchCriteria);
    };
}
