import _ from 'lodash';
import {gettext} from 'core/utils';

const DEFAULT_PAGE_SIZE = 25;

/**
 * @ngdoc service
 * @module superdesk.apps.content-api
 * @name sdContentApiSearch
 * @requires api
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @requires sort
 * @requires search
 * @description Handles retrieval of data from content api
 */
export class ContentAPISearchService {
    constructor(api, $location, sort, search) {
        this.api = api;
        this.$location = $location;
        this.sort = sort;
        this.sortOptions = [
            {field: 'versioncreated', label: gettext('Updated')},
            {field: 'firstcreated', label: gettext('Created')},
            {field: 'urgency', label: gettext('Urgency')},
            {field: 'priority', label: gettext('Priority')},
            {field: 'slugline', label: gettext('Slugline')},
            {field: 'service.name', label: gettext('Category')},
        ];
        this.search = search;
    }

    /**
     * @ngdoc method
     * @name sdContentApiSearch#_getFilters
     * @private
     * @param {object} params - $location.search()
     * @description Create elasticsearch filters.
     * @return {Array<object>} list of filters
     */
    _getFilters(params) {
        let filters = [];

        // set filters for parameters
        if (params.subject) {
            filters.push({or: [
                {terms: {'subject.code': JSON.parse(params.subject)}},
                {terms: {'subject.parent': JSON.parse(params.subject)}},
            ]});
        }

        if (params.company_codes) {
            filters.push({terms: {'organisation.symbols.ticker': JSON.parse(params.company_codes)}});
        }

        _.each(['genre', 'category', 'urgency', 'priority', 'type', 'source'], (key) => {
            if (!params[key]) {
                return;
            }

            const termKey = {
                type: 'type',
                genre: 'genre.name',
                category: 'service.name',
                urgency: 'urgency',
                source: 'source',
                priority: 'priority',
            }[key];

            if (termKey) {
                let f = {terms: {}};

                f.terms[termKey] = JSON.parse(params[key]);
                filters.push(f);
            }
        });

        return filters;
    }

    /**
     * @ngdoc method
     * @name sdContentApiSearch#getCriteria
     * @public
     * @description Creates the url parameters object for backend query.
     * @param {object} param $location.search object
     * @return {object}
     */
    getCriteria(param) {
        let criteria = {};
        let params = param || this.$location.search();
        let sort = this.sort.getSort(this.sortOptions);

        criteria.max_results = DEFAULT_PAGE_SIZE;
        criteria.sort = this.sort.formatSort(sort.field, sort.dir);
        criteria.page = 1;

        const buildRangeFilter = (params, filters) => {
            // created & modified date filters
            let hasParams = params.beforefirstcreated || params.afterfirstcreated ||
                params.beforeversioncreated || params.afterversioncreated;
            let zeroHourSuffix = 'T00:00:00',
                midnightSuffix = 'T23:59:59';

            if (hasParams) {
                let range = {firstcreated: {}, versioncreated: {}};

                if (params.beforefirstcreated) {
                    range.firstcreated.lte = this.search.formatDate(params.beforefirstcreated, midnightSuffix);
                }

                if (params.afterfirstcreated) {
                    range.firstcreated.gte = this.search.formatDate(params.afterfirstcreated, zeroHourSuffix);
                }

                if (params.beforeversioncreated) {
                    range.versioncreated.lte = this.search.formatDate(params.beforeversioncreated, midnightSuffix);
                }

                if (params.afterversioncreated) {
                    range.versioncreated.gte = this.search.formatDate(params.afterversioncreated, zeroHourSuffix);
                }

                filters.push({range: range});
            } else if (params.after) {
                let range = {firstcreated: {}};

                range.firstcreated.gte = params.after;
                filters.push({range: range});
            }
        };

        if (params.subscriber) {
            criteria.subscribers = params.subscriber;
        }

        if (params.q) {
            criteria.q = params.q;
            criteria.default_operator = 'AND';
        }

        let filters = this._getFilters(params);

        buildRangeFilter(params, filters);

        if (filters.length > 0) {
            criteria.filter = JSON.stringify(filters);
        }

        return criteria;
    }

    /**
     * @ngdoc method
     * @name sdContentApiSearch#getCriteria
     * @public
     * @description Creates the url parameters object for backend query.
     * @param {object} param parameters to search
     * @return {promise}
     */
    query(param) {
        return this.api.search_capi.query(param);
    }
}

ContentAPISearchService.$inject = ['api', '$location', 'sort', 'search'];
