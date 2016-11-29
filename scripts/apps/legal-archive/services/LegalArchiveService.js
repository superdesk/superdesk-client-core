LegalArchiveService.$inject = ['$q', 'api', 'notify', '$location', 'gettext', 'config'];
export function LegalArchiveService($q, api, notify, $location, gettext, config) {
    var DEFAULT_PER_PAGE = 25;
    this.default_items = Object.freeze({_meta: {max_results: DEFAULT_PER_PAGE, page: 1, total: 1}});

    var sortOptions = [
        {field: 'versioncreated', label: gettext('Updated')},
        {field: 'firstcreated', label: gettext('Created')},
        {field: 'urgency', label: gettext('Urgency')},
        {field: 'anpa_category.name', label: gettext('Category')},
        {field: 'slugline', label: gettext('Slugline')},
        {field: 'priority', label: gettext('Priority')}
    ];

    function getSort() {
        var sort = ($location.search().sort || 'versioncreated:desc').split(':');
        return angular.extend(_.find(sortOptions, {field: sort[0]}), {dir: sort[1]});
    }

    function sort(field) {
        var option = _.find(sortOptions, {field: field});
        setSortSearch(option.field, option.defaultDir || 'desc');
    }

    function toggleSortDir() {
        var sort = getSort();
        var dir = sort.dir === 'asc' ? 'desc' : 'asc';
        setSortSearch(sort.field, dir);
    }

    function formatSort(key, dir) {
        var val = dir === 'asc' ? 1 : -1;
        return '[("' + encodeURIComponent(key) + '", ' + val + ')]';
    }

    function setSortSearch(field, dir) {
        $location.search('sort', field + ':' + dir);
        $location.search('page', null);
    }

    sort('versioncreated');

    // sort public api
    this.setSort = sort;
    this.getSort = getSort;
    this.sortOptions = sortOptions;
    this.toggleSortDir = toggleSortDir;

    this.getCriteria = function() {
        var params = $location.search(),
            criteria = {
                max_results: Number(params.max_results) || DEFAULT_PER_PAGE
            };

        if (params.q) {
            criteria.where = params.q;
        }

        if (params.page) {
            criteria.page = parseInt(params.page, 10);
        }

        if (params.sort) {
            var sort = params.sort.split(':');
            criteria.sort = formatSort(sort[0], sort[1]);
        } else {
            criteria.sort = formatSort('versioncreated', 'desc');
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

        _.forEach(search, function(n, key) {
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
                $and: where
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
