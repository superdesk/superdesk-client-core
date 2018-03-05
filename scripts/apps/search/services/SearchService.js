import {
    PARAMETERS,
    EXCLUDE_FACETS,
    CORE_PROJECTED_FIELDS,
    UI_PROJECTED_FIELD_MAPPINGS,
    DEFAULT_LIST_CONFIG
} from 'apps/search/constants';

import _ from 'lodash';

/**
 * @ngdoc service
 * @module superdesk.apps.search
 * @name search
 *
 * @requires $location
 * @requires gettext
 * @requires config
 * @requires session
 * @requires multi
 * @requires preferencesService
 * @requires moment
 * @requires sort
 * @requires deployConfig
 *
 * @description Search Service is responsible for creation and manipulation of Query object
 */
SearchService.$inject = [
    '$location',
    'gettext',
    'config',
    'session',
    'multi',
    'preferencesService',
    'moment',
    'sort',
    'deployConfig'
];
export function SearchService($location, gettext, config, session, multi,
    preferencesService, moment, sortService, deployConfig) {
    var sortOptions = [
        {field: 'versioncreated', label: gettext('Updated')},
        {field: 'firstcreated', label: gettext('Created')},
        {field: 'urgency', label: gettext('Urgency')},
        {field: 'anpa_category.name', label: gettext('ANPA Category')},
        {field: 'slugline.phrase', label: gettext('Slugline')},
        {field: 'priority', label: gettext('Priority')},
        {field: 'genre.name', label: gettext('Genre')}
    ];

    var self = this;

    this.cvs = config.search_cvs ||
        [{id: 'subject', name: 'Subject', field: 'subject', list: 'subjectcodes'},
            {id: 'companycodes', name: 'Company Codes', field: 'company_codes', list: 'company_codes'}];

    preferencesService.get('singleline:view').then((result) => {
        if (result) {
            // No preference, but global config set
            if (result.enabled === null && _.get(config, 'list.singleLineView') && _.get(config, 'list.singleLine')) {
                this.singleLine = true;
                return;
            }

            // Preference set, but singleLine not in config
            if (result.enabled && !_.get(config, 'list.singleLine')) {
                this.singleLine = false;
                return;
            }

            this.singleLine = result.enabled;
        }
    });

    /*
     * Set filters for parameters
     */
    function setParameters(filters, params) {
        const addFromDeskFilter = function(key) {
            let desk = params[key].split('-');

            if (desk.length === 2) {
                if (desk[1] === 'authoring') {
                    filters.push({term: {'task.last_authoring_desk': desk[0]}});
                } else {
                    filters.push({term: {'task.last_production_desk': desk[0]}});
                }
            }
        };

        const addToDeskFilter = function(key) {
            let desk = params[key].split('-');

            if (desk.length === 2) {
                filters.push({term: {'task.desk': desk[0]}});
                if (!params.from_desk) {
                    var field = desk[1] === 'authoring' ? 'task.last_production_desk' : 'task.last_authoring_desk';

                    filters.push({exists: {field: field}});
                }
            }
        };

        angular.forEach(self.cvs, (cv) => {
            if (params[cv.id] && cv.field !== cv.id) {
                var filter = {terms: {}};

                filter.terms[cv.field + '.qcode'] = JSON.parse(params[cv.id]);
                filters.push(filter);
            }
        });

        // set the filters for parameters defined in the parameters panel.
        _.each(PARAMETERS, (value, key) => {
            if (!params[key]) {
                return;
            }

            switch (key) {
            case 'from_desk':
                addFromDeskFilter(key);
                break;
            case 'to_desk':
                addToDeskFilter(key);
                break;
            case 'spike':
                // Will get set in the base filters
                break;
            case 'featuremedia':
                filters.push({exists: {field: 'associations.featuremedia'}});
                break;
            case 'subject':
                filters.push({or: [
                    {terms: {'subject.qcode': JSON.parse(params[key])}},
                    {terms: {'subject.parent': JSON.parse(params[key])}}
                ]});
                break;
            case 'company_codes':
                filters.push({terms: {'company_codes.qcode': JSON.parse(params[key])}});
                break;
            case 'marked_desks':
                filters.push({terms: {'marked_desks.desk_id': JSON.parse(params[key])}});
                break;
            default:
                var filter = {term: {}};

                filter.term[key] = params[key];
                filters.push(filter);
            }
        });

        // Set filters for Aggregates when facet is removed from the filter panel.
        _.each(EXCLUDE_FACETS, (value, key) => {
            if (!params[key]) {
                return;
            }

            const termKey = {
                nottype: 'type',
                notdesk: 'task.desk',
                notgenre: 'genre.name',
                notcategory: 'anpa_category.name',
                noturgency: 'urgency',
                notpriority: 'priority',
                notsource: 'source',
                notlegal: 'flags.marked_for_legal',
                notsms: 'flags.marked_for_sms'
            }[key];

            if (termKey) {
                let f = {not: {terms: {}}};

                f.not.terms[termKey] = JSON.parse(params[key]);
                filters.push(f);
            }
        });
    }

    /*
     * Function for finding object by string array for cv codes
     */
    this.getSelectedCodes = function(currentTags, codeList, field) {
        var queryArray = currentTags.selectedParameters, filteredArray = [];

        if (!$location.search().q) {
            return filteredArray;
        }
        for (var i = 0, queryArrayLength = queryArray.length; i < queryArrayLength; i++) {
            var queryArrayElement = queryArray[i];

            if (queryArrayElement.indexOf(field + '.qcode') === -1 &&
                queryArrayElement.indexOf(field + '.name') === -1) {
                continue;
            }
            var elementName = queryArrayElement.substring(
                queryArrayElement.lastIndexOf('(') + 1,
                queryArrayElement.lastIndexOf(')')
            );

            for (var j = 0, codeListLength = codeList.length; j < codeListLength; j++) {
                if (codeList[j].qcode === elementName || codeList[j].name === elementName) {
                    filteredArray.push(codeList[j]);
                }
            }
        }
        return filteredArray;
    };

    /*
     * Function for finding object by string array for subject codes
     */
    this.getSubjectCodes = function(currentTags, subjectcodes) {
        return this.getSelectedCodes(currentTags, subjectcodes, 'subject');
    };

    /*
     * Function for finding object by string array for company codes
     */
    this.getCompanyCodes = function(currentTags, codes) {
        return this.getSelectedCodes(currentTags, codes, 'company_codes');
    };

    this.sortOptions = sortOptions;

    /**
     * Converts the integer fields to string
     * within a given search
     *
     * @return {Object} the updated search object
     */
    this.setFilters = function(search) {
        _.forOwn(search, (value, key) => {
            if (_.includes(['priority', 'urgency'], key)) {
                search[key] = JSON.stringify(value);
            }
        });

        return search;
    };

    /**
     * Prepares the date based on the timezone settings.
     * If useDefaultTimezone is used then all search are based on the server timezone else users browser timezone
     * @param {String} date - Date selected by the User
     * @param {String} timeSuffix - time part
     * @return {String} date
     */
    function formatDate(date, timeSuffix) {
        var local = moment(date, config.view.dateformat).format('YYYY-MM-DD') + timeSuffix;

        if (config.search && config.search.useDefaultTimezone) {
            // use the default timezone of the server.
            local += moment.tz(config.defaultTimezone).format('ZZ');
        } else {
            // use the client timezone of the server.
            local += moment().format('ZZ');
        }
        return local;
    }

    this.formatDate = formatDate;

    /**
     * Single query instance
     */
    function Query(_params) {
        var size,
            filters = [],
            postFilters = [],
            params = {},
            zeroHourSuffix = 'T00:00:00',
            midnightSuffix = 'T23:59:59';

        angular.forEach(_params, (value, key) => {
            params[key] = value;
        });

        if (params.q) {
            angular.forEach(this.cvs, (cv) => {
                if (cv.field !== cv.id) {
                    params.q = params.q.replace(cv.id + '.qcode:(', cv.field + '.qcode:(');
                }
            });
        }

        function buildRangeFilter(params, query) {
            // created & modified date filters
            let hasParams = params.beforefirstcreated || params.afterfirstcreated ||
                params.beforeversioncreated || params.afterversioncreated;

            if (!hasParams) {
                return;
            }

            var range = {firstcreated: {}, versioncreated: {}};

            if (params.beforefirstcreated) {
                range.firstcreated.lte = formatDate(params.beforefirstcreated, midnightSuffix);
            }

            if (params.afterfirstcreated) {
                range.firstcreated.gte = formatDate(params.afterfirstcreated, zeroHourSuffix);
            }

            if (params.beforeversioncreated) {
                range.versioncreated.lte = formatDate(params.beforeversioncreated, midnightSuffix);
            }

            if (params.afterversioncreated) {
                range.versioncreated.gte = formatDate(params.afterversioncreated, zeroHourSuffix);
            }

            query.post_filter({range: range});
        }

        function buildGeneralFilters(params, query) {
            if (params.urgency) {
                query.post_filter({terms: {urgency: JSON.parse(params.urgency)}});
            }

            if (params.priority) {
                query.post_filter({terms: {priority: JSON.parse(params.priority)}});
            }

            if (params.source) {
                query.post_filter({terms: {source: JSON.parse(params.source)}});
            }

            // used by aap multimedia datalayer
            if (params.creditqcode) {
                query.post_filter({terms: {credit: _.map(JSON.parse(params.creditqcode), 'value')}});
            }

            if (params.category) {
                query.post_filter({terms: {'anpa_category.name': JSON.parse(params.category)}});
            }

            if (params.genre) {
                query.post_filter({terms: {'genre.name': JSON.parse(params.genre)}});
            }

            if (params.desk) {
                query.post_filter({terms: {'task.desk': JSON.parse(params.desk)}});
            }

            if (params.legal) {
                query.post_filter({terms: {'flags.marked_for_legal': JSON.parse(params.legal)}});
            }

            if (params.sms) {
                query.post_filter({terms: {'flags.marked_for_sms': JSON.parse(params.sms)}});
            }

            if (params.language) {
                query.post_filter({terms: {language: JSON.parse(params.language)}});
            }
        }

        /**
          * Builds Post Filter search query used when the filtering done via facets/aggregates.
          * @param {String} params - search parameters
          * @param {Object} query - Query object
          */
        function buildFilters(params, query) {
            buildRangeFilter(params, query);

            if (params.after) {
                var facetrange = {firstcreated: {}};

                facetrange.firstcreated.gte = params.after;
                query.post_filter({range: facetrange});
            }

            if (params.scheduled_after) {
                query.post_filter({range: {'schedule_settings.utc_publish_schedule': {gte: params.scheduled_after}}});
            }

            if (params.type) {
                var type = {
                    type: JSON.parse(params.type)
                };

                query.post_filter({terms: type});
            }

            buildGeneralFilters(params, query);
        }

        /**
         * Get criteria for given query
         */
        this.getCriteria = function getCriteria(withSource) {
            let search = params;
            let sort = sortService.getSort(sortOptions);

            setParameters(filters, params);
            let criteria = {
                query: {filtered: {filter: {and: filters}}},
                sort: [_.zipObject([sort.field], [sort.dir])]
            };

            if (postFilters.length > 0) {
                criteria.post_filter = {and: postFilters};
            }

            // Construct the query string by combining the q parameter and the raw parameter, if both present
            let queryString = null;

            if (search.q && search.raw) {
                queryString = [search.q, search.raw]
                    .filter((q) => q)
                    .map((q) => '(' + q.replace(/\//g, '\\/') + ')')
                    .join(' AND ');
            } else {
                queryString = [search.q, search.raw]
                    .filter((q) => q)
                    .map((q) => q.replace(/\//g, '\\/'))
                    .join('');
            }

            if (queryString) {
                criteria.query.filtered.query = {query_string: {
                    query: queryString,
                    lenient: false,
                    default_operator: 'AND'
                }};
            }

            if (withSource) {
                criteria = {source: criteria};
                if (search.repo) {
                    criteria.repo = search.repo;
                }
            }

            return criteria;
        };

        /**
         * Add filter to query
         *
         * @param {Object} filter
         */
        this.filter = function addFilter(filter) {
            filters.push(filter);
            return this;
        };

        /**
         * Add post filter to query
         *
         * @param {Object} filter
         */
        this.post_filter = function addPostFilter(filter) {
            postFilters.push(filter);
            return this;
        };

        /**
         * Clears all filters
         */
        this.clear_filters = function clearFilters() {
            filters = [];
            postFilters = [];
            buildFilters({}, this);
            return this;
        };

        /**
         * Set size
         *
         * @param {number} _size
         */
        this.size = function setSize(_size) {
            size = !_.isNil(_size) ? _size : size;
            return this;
        };

        // set spiked filters
        if (params.spike === 'include') {
            // no filters needed
        } else if (params.spike === 'only') {
            this.filter({term: {state: 'spiked'}});
        } else {
            // default exclude spiked items
            this.filter({not: {term: {state: 'spiked'}}});
        }

        if (params.ignoreKilled) {
            this.filter({not: {term: {state: 'killed'}}});
        }

        if (params.onlyLastPublished) {
            this.filter({not: {term: {last_published_version: 'false'}}});
        }

        if (params.ignoreScheduled) {
            this.filter({not: {term: {state: 'scheduled'}}});
        }

        // remove other users drafts.
        this.filter({or: [{and: [{term: {state: 'draft'}},
            {term: {original_creator: session.identity._id}}]},
        {not: {terms: {state: ['draft']}}}]});

        // this is needed for archived collection
        this.filter({not: {term: {package_type: 'takes'}}});

        buildFilters(params, this);
    }

    /**
     * Start creating a new query
     *
     * @param {Object} params
     */
    this.query = function createQuery(params) {
        return new Query(params);
    };

    /**
     * Generate Track By Identifier for search results.
     *
     * @param {Object} item
     * @return {String}
     */
    this.generateTrackByIdentifier = function(item) {
        return this.getTrackByIdentifier(item._id, item.state !== 'ingested' ? item._current_version : null);
    };

    /**
     * Get unique id for an item
     *
     * @param {String} id
     * @param {String} version
     * @return {String}
     */
    this.getTrackByIdentifier = function(id, version) {
        return version ? id + ':' + version : id;
    };

    /*
     * helper to compare if items in 'a' are different with 'b' on _id and _current_version, if type is published.
     */
    function compareWith(a, b) {
        return _.filter(a._items, (item) => {
            if (item._type === 'published') {
                return !_.find(b._items, {_id: item._id, _current_version: item._current_version});
            }

            return !_.find(b._items, {_id: item._id});
        });
    }

    /*
     * To determine if refresh button needs to be shown, i-e:
     * when any difference found in scopeItems and recently fetched newItems
     *
     * @param {Object} data - {newItems, scopeItems, scrollTop, isItemPreviewing}
     */
    this.canShowRefresh = function(data) {
        var _showRefresh, diff = [];

        if (data.scopeItems) {
            // determine if items are different (in terms of added or removed) in scope items from
            // fetched new items or vice versa.
            diff = compareWith(data.scopeItems, data.newItems);
            if (_.isEmpty(diff)) {
                diff = compareWith(data.newItems, data.scopeItems);
            }
        }

        if (!_.isEmpty(diff)) {
            // if different, then determine _showReferesh, such that, if item is previewing or scroll in not on top.
            _showRefresh = data.isItemPreviewing || !!data.scrollTop;
        }

        return _showRefresh;
    };

    /**
     * @ngdoc method
     * @name search#mergeHighlightFields
     * @public
     * @description Merges the highlighted fields to the item
     * @param {Object} item
     * @returns {Object}
     */
    this.mergeHighlightFields = function(item) {
        if (item.es_highlight) {
            _.forEach(_.keys(item.es_highlight), (key) => {
                item[key] = item.es_highlight[key][0];
            });
        } else {
            item.es_highlight = [];
        }
        return item;
    };

    /**
     * Merge newItems list with scopeItems list if any
     *
     * @param {Object} newItems
     * @param {Object} scopeItems
     * @param {boolean} append
     * @param {boolean} force
     * @returns {Object}
     */
    this.mergeItems = function(newItems, scopeItems, append, force) {
        if (this.getElasticHighlight()) {
            newItems._items = _.map(newItems._items, this.mergeHighlightFields);
        }

        newItems._items.forEach((item) => {
            item.selected = multi.isSelected(item);
        });

        if (force || !scopeItems) {
            return newItems;
        } else if (append && scopeItems) {
            var nextItems = scopeItems._items.concat(newItems._items);

            return angular.extend({}, newItems, {_items: nextItems});
        }

        // items in scopeItem, which are no longer exist in fetched newItems. i-e; need to remove from scopeItems
        var diffToMinus = _.map(compareWith(scopeItems, newItems), '_id');

        // items in fetched newItems, which are new for scopeItems. i-e; need to include in scopeItems
        var diffToAdd = _.map(compareWith(newItems, scopeItems), '_id');

        // if fetched items are new or removed then update current scope.items
        // by adding or removing items found in diffToAdd or diffToMinus respectively.
        if (!_.isEmpty(diffToMinus)) {
            _.remove(scopeItems._items, (item) => _.includes(diffToMinus, item._id));
        }

        if (!_.isEmpty(diffToAdd)) {
            var index = 0;

            _.map(newItems._items, (item) => {
                if (_.includes(diffToAdd, item._id)) {
                    // insert item at its place from the fetched sorted items
                    scopeItems._items.splice(index, 0, item);
                }

                index++;
            });
        }
        // update scope.item item-wise with matching fetched items to maintain
        // item's current position in scope.
        return this.updateItems(newItems, scopeItems); // i.e. updated scope.items
    };

    /**
     * Check if elasticsearch highlight feature is configured or not.
     */
    this.getElasticHighlight = function() {
        return config.features && config.features.elasticHighlight ? 1 : 0;
    };

    /**
     * Returns a query to search items by id
     *
     * @param {Object} items - {_id: 1}
     */
    this.getItemQuery = function(items) {
        var updatedItems = _.keys(items);

        return {filtered: {filter: {terms: {_id: updatedItems}}}};
    };

    /**
     * @ngdoc method
     * @name search#doesSearchAgainstRepo
     * @public
     * @returns {Boolean}
     * @description Checks if the given search object will do the search agains the given repo
     * @param {Object} search search criteria
     * @param {String} repo name of the repo: ingest, archive, published, archived
     */
    this.doesSearchAgainstRepo = function(search, repo) {
        return !search.filter.query.repo || search.filter.query.repo.toLowerCase().indexOf(repo.toLowerCase()) !== -1;
    };

    /**
     * @ngdoc method
     * @name search#getSingleItemCriteria
     * @public
     * @returns {Object}
     * @description Returns the query criteria for a single item while keeping keywords or
     * q values so that the results will have highlights
     * @param {Object} item
     * @param {Object} criteria
     */
    this.getSingleItemCriteria = function(item, criteria) {
        let itemCriteria = criteria || this.query($location.search()).getCriteria(true);

        itemCriteria.source.from = 0;
        itemCriteria.source.size = 1;
        itemCriteria.es_highlight = this.getElasticHighlight();

        let itemId = item._type !== 'published' ? item._id : item.item_id;

        itemCriteria.source.query.filtered.filter = {
            or: [
                {term: {_id: itemId}}, {term: {item_id: itemId}}
            ]
        };
        return itemCriteria;
    };

    /**
     * Update scope items only with the matching fetched newItems
     *
     * @param {Object} newItems
     * @param {Object} scopeItems
     * @return {Object}
     */
    this.updateItems = function(newItems, scopeItems) {
        _.map(scopeItems._items, (item) => {
            if (item._type === 'published') {
                return _.extend(item, _.find(newItems._items,
                    {_id: item._id, _current_version: item._current_version}));
            }

            // remove gone flag to prevent item remaining grey, if gone item moves back to this stage.
            let itm = item;

            if (angular.isDefined(item.gone)) {
                itm = _.omit(item, 'gone');
            }

            return _.extend(itm, _.find(newItems._items, {_id: itm._id}));
        });

        // update aggregations
        scopeItems._aggregations = newItems._aggregations;

        return angular.extend({}, scopeItems);
    };

    /**
     * @ngdoc method
     * @name search#getProjectedFields
     * @public
     * @returns {Array}
     * @description Returns the list of fields to be used in projections
     */
    this.getProjectedFields = function() {
        var uiConfig = config.list || DEFAULT_LIST_CONFIG;
        var uiFields = _.union(uiConfig.priority, uiConfig.firstLine, uiConfig.secondLine);

        let projectedFields = [];

        uiFields.forEach((uiField) => {
            if (uiField in UI_PROJECTED_FIELD_MAPPINGS) {
                projectedFields.push(UI_PROJECTED_FIELD_MAPPINGS[uiField]);
            }
        });
        return _.union(CORE_PROJECTED_FIELDS.fields, projectedFields);
    };

    /**
     * @ngdoc method
     * @name search#updateSingleLineStatus
     * @public
     * @returns {Boolean}
     * @description updates singleLine value after computation
     */
    this.updateSingleLineStatus = function(singleLinePref) {
        if (singleLinePref && _.get(config, 'list.singleLine')) {
            self.singleLine = true;
            return;
        }

        self.singleLine = false;
    };
}
