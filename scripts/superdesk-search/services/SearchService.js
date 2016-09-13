import { PARAMETERS } from 'superdesk-search/constants';

SearchService.$inject = ['$location', 'gettext', 'config', 'session'];
export function SearchService($location, gettext, config, session) {
    var sortOptions = [
        {field: 'versioncreated', label: gettext('Updated')},
        {field: 'firstcreated', label: gettext('Created')},
        {field: 'urgency', label: gettext('Urgency')},
        {field: 'anpa_category.name', label: gettext('ANPA Category')},
        {field: 'slugline.phrase', label: gettext('Slugline')},
        {field: 'priority', label: gettext('Priority')},
        {field: 'genre.name', label: gettext('Genre')}
    ];

    this.cvs = config.search_cvs ||
    [{'id': 'subject', 'name': 'Subject', 'field': 'subject', 'list': 'subjectcodes'},
    {'id': 'companycodes', 'name': 'Company Codes', 'field': 'company_codes', 'list': 'company_codes'}];

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

    function setSortSearch(field, dir) {
        $location.search('sort', field + ':' + dir);
        $location.search('page', null);
    }

    /*
     * Set filters for parameters
     */
    function setParameters(filters, params) {
        _.each(PARAMETERS, function(value, key) {
            if (params[key]) {
                var desk;
                switch (key) {
                    case 'from_desk':
                        desk = params[key].split('-');
                        if (desk.length === 2) {
                            if (desk[1] === 'authoring') {
                                filters.push({'term': {'task.last_authoring_desk': desk[0]}});
                            } else {
                                filters.push({'term': {'task.last_production_desk': desk[0]}});
                            }
                        }
                        break;
                    case 'to_desk':
                        desk = params[key].split('-');
                        if (desk.length === 2) {
                            filters.push({'term': {'task.desk': desk[0]}});
                            if (!params.from_desk) {
                                var field = desk[1] === 'authoring' ? 'task.last_production_desk' : 'task.last_authoring_desk';
                                filters.push({'exists': {'field': field}});
                            }
                        }
                        break;
                    case 'spike':
                        // Will get set in the base filters
                        break;
                    case 'subject':
                        filters.push({'terms': {'subject.qcode': JSON.parse(params[key])}});
                        break;
                    case 'company_codes':
                        filters.push({'terms': {'company_codes.qcode': JSON.parse(params[key])}});
                        break;
                    default:
                        var filter = {'term': {}};
                        filter.term[key] = params[key];
                        filters.push(filter);
                }
            }
        });
    }

    /*
     * Function for finding object by string array for cv codes
     */
    this.getSelectedCodes = function (currentTags, codeList, field) {
        var queryArray = currentTags.selectedParameters, filteredArray = [];
        if (!$location.search().q) {
            return filteredArray;
        }
        for (var i = 0, queryArrayLength = queryArray.length; i < queryArrayLength; i++) {
            var queryArrayElement = queryArray[i];
            if (queryArrayElement.indexOf(field + '.qcode') !== -1 ||
                queryArrayElement.indexOf(field + '.name') !== -1) {
                var elementName = queryArrayElement.substring(
                        queryArrayElement.lastIndexOf('(') + 1,
                        queryArrayElement.lastIndexOf(')'));
                for (var j = 0, codeListLength = codeList.length; j < codeListLength; j++) {
                    if (codeList[j].qcode === elementName || codeList[j].name === elementName) {
                        filteredArray.push(codeList[j]);
                    }
                }
            }
        }
        return filteredArray;
    };

    /*
     * Function for finding object by string array for subject codes
     */
    this.getSubjectCodes = function (currentTags, subjectcodes) {
        return this.getSelectedCodes(currentTags, subjectcodes, 'subject');
    };

    /*
     * Function for finding object by string array for company codes
     */
    this.getCompanyCodes = function (currentTags, codes) {
        return this.getSelectedCodes(currentTags, codes, 'company_codes');
    };

    // sort public api
    this.setSort = sort;
    this.getSort = getSort;
    this.sortOptions = sortOptions;
    this.toggleSortDir = toggleSortDir;

    /**
     * Converts the integer fields to string
     * within a given search
     *
     * @return {Object} the updated search object
     */
    this.setFilters = function(search) {
        _.forOwn(search, function(value, key) {
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
     * @param {String} time_suffix - time part
     * @return {String} date
     */
    function formatDate(date, time_suffix) {
        var local = moment(date, config.view.dateformat).format('YYYY-MM-DD') + time_suffix;
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
            post_filters = [],
            params = {},
            zero_hour_suffix = 'T00:00:00',
            midnight_suffix = 'T23:59:59';

        angular.forEach(_params, function(value, key) {
            params[key] = value;
        });

        if (params.q) {
            angular.forEach(this.cvs, function(cv) {
                if (cv.field !== cv.id) {
                    params.q = params.q.replace(cv.id + '.qcode:(', cv.field + '.qcode:(');
                }
            });
        }

        function buildFilters(params, query) {

            //created & modified date filters
            if (params.beforefirstcreated || params.afterfirstcreated ||
                params.beforeversioncreated || params.afterversioncreated) {
                var range = {firstcreated: {}, versioncreated: {}};

                if (params.beforefirstcreated) {
                    range.firstcreated.lte = formatDate(params.beforefirstcreated, midnight_suffix);
                }

                if (params.afterfirstcreated) {
                    range.firstcreated.gte = formatDate(params.afterfirstcreated, zero_hour_suffix);
                }

                if (params.beforeversioncreated) {
                    range.versioncreated.lte = formatDate(params.beforeversioncreated, midnight_suffix);
                }

                if (params.afterversioncreated) {
                    range.versioncreated.gte = formatDate(params.afterversioncreated, zero_hour_suffix);
                }

                query.post_filter({range: range});
            }

            if (params.after)
            {
                var facetrange = {firstcreated: {}};
                facetrange.firstcreated.gte = params.after;
                query.post_filter({range: facetrange});
            }

            if (params.scheduled_after) {
                var schedulerange = {utc_publish_schedule: {}};
                schedulerange.utc_publish_schedule.gte = params.scheduled_after;
                query.post_filter({range: schedulerange});
            }

            if (params.type) {
                var type = {
                    type: JSON.parse(params.type)
                };
                query.post_filter({terms: type});
            }

            if (params.urgency) {
                query.post_filter({terms: {urgency: JSON.parse(params.urgency)}});
            }

            if (params.priority) {
                query.post_filter({terms: {priority: JSON.parse(params.priority)}});
            }

            if (params.source) {
                query.post_filter({terms: {source: JSON.parse(params.source)}});
            }

            if (params.credit && params.creditqcode) {
                query.post_filter({terms: {credit: JSON.parse(params.creditqcode)}});
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

            if (config.features && config.features.noTakes) {
                query.post_filter({bool: {must_not: {term: {package_type: 'takes'}}}});
            }
        }

        /**
         * Get criteria for given query
         */
        this.getCriteria = function getCriteria(withSource) {
            var search = params;
            var sort = getSort();
            setParameters(filters, params);
            var criteria = {
                query: {filtered: {filter: {and: filters}}},
                sort: [_.zipObject([sort.field], [sort.dir])]
            };

            if (post_filters.length > 0) {
                criteria.post_filter = {'and': post_filters};
            }

            if (search.q) {
                criteria.query.filtered.query = {query_string: {
                    query: search.q.replace(/\//g, '\\/'),
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

        this.post_filter = function addPostFilter(filter) {
            post_filters.push(filter);
            return this;
        };

        this.clear_filters = function clearFilters() {
            filters = [];
            post_filters = [];
            buildFilters({}, this);
            return this;
        };

        /**
         * Set size
         *
         * @param {number} _size
         */
        this.size = function setSize(_size) {
            size = _size != null ? _size : size;
            return this;
        };

        // do base filtering
        if (params.spike) {
            this.filter({term: {state: 'spiked'}});
        } else {
            this.filter({not: {term: {state: 'spiked'}}});
        }

        if (params.ignoreKilled) {
            this.filter({not: {term: {state: 'killed'}}});
        }

        if (params.onlyLastPublished) {
            this.filter({not: {term: {last_published_version: 'false'}}});
        }

        if (params.ignoreDigital) {
            this.filter({not: {term: {package_type: 'takes'}}});
        }

        if (params.ignoreScheduled) {
            this.filter({not: {term: {state: 'scheduled'}}});
        }

        // remove the older version of digital package as part for base filtering.
        this.filter({not: {and: [{term: {_type: 'published'}},
            {term: {package_type: 'takes'}},
            {term: {last_published_version: false}}]}});

        // remove other users drafts.
        this.filter({or:[{and: [{term: {state: 'draft'}},
                               {term: {'original_creator': session.identity._id}}]},
                         {not: {terms: {state: ['draft']}}}]});

        //remove the digital package from production view.
        this.filter({not: {and: [{term: {package_type: 'takes'}}, {term: {_type: 'archive'}}]}});

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
    this.generateTrackByIdentifier = function (item) {
        return this.getTrackByIdentifier(item._id, item.state !== 'ingested' ? item._current_version : null);
    };

    /**
     * Get unique id for an item
     *
     * @param {String} id
     * @param {String} version
     * @return {String}
     */
    this.getTrackByIdentifier = function (id, version) {
        return version ? (id + ':' + version) : id;
    };

    /*
     * helper to compare if items in 'a' are different with 'b' on _id and _current_version, if type is published.
     */
    function compareWith(a, b) {
        return _.filter(a._items, function(item) {
            if (item._type === 'published') {
                return !_.find(b._items, {_id: item._id, _current_version: item._current_version});
            } else {
                return !_.find(b._items, {_id: item._id});
            }
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
            _showRefresh = (data.isItemPreviewing || !!data.scrollTop);
        }

        return _showRefresh;
    };

    /**
     * Merge newItems list with scopeItems list if any
     *
     * @param {Object} newItems
     * @param {Object} scopeItems
     * @param {boolean} append
     * @param {boolean} force
     * @return {Object}
     */

    this.mergeItems = function(newItems, scopeItems, append, force) {
        if (this.getElasticHighlight()) {
            newItems._items = _.map(newItems._items, function(item) {
                if (item.es_highlight) {
                    _.forEach(_.keys(item.es_highlight), function (key) {
                        item[key] = item.es_highlight[key][0];
                    });
                } else {
                    item.es_highlight = [];
                }
                return item;
            });
        }

        if (force || !scopeItems) {
            return newItems;
        } else if (append && scopeItems) {
            var nextItems = scopeItems._items.concat(newItems._items);
            return angular.extend({}, newItems, {_items: nextItems});
        } else {
            // items in scopeItem, which are no longer exist in fetched newItems. i-e; need to remove from scopeItems
            var diffToMinus = _.map(compareWith(scopeItems, newItems), '_id');

            // items in fetched newItems, which are new for scopeItems. i-e; need to include in scopeItems
            var diffToAdd = _.map(compareWith(newItems, scopeItems), '_id');

            // if fetched items are new or removed then update current scope.items
            // by adding or removing items found in diffToAdd or diffToMinus respectively.
            if (!_.isEmpty(diffToMinus)) {
                _.remove(scopeItems._items, function (item) {
                    return _.includes(diffToMinus, item._id);
                });
            }

            if (!_.isEmpty(diffToAdd)) {
                var index = 0;
                _.map(newItems._items, function(item) {
                    if (_.includes(diffToAdd, item._id)) {
                        // insert item at its place from the fetched sorted items
                        scopeItems._items.splice(index, 0, item);
                    }

                    index++;
                });
            }
            // update scope.item item-wise with matching fetched items to maintain
            // item's current position in scope.
            scopeItems = this.updateItems(newItems, scopeItems);

            return scopeItems; // i.e. updated scope.items
        }
    };

    this.getElasticHighlight = function() {
        return config.features && config.features.elasticHighlight ? 1 : 0;
    };

    /**
     * Update scope items only with the matching fetched newItems
     *
     * @param {Object} newItems
     * @param {Object} scopeItems
     * @return {Object}
     */
    this.updateItems = function(newItems, scopeItems) {
        _.map(scopeItems._items, function(item) {
            if (item._type === 'published') {
                return _.extend(item, _.find(newItems._items,
                    {_id: item._id, _current_version: item._current_version}));
            } else {
                // remove gone flag to prevent item remaining grey, if gone item moves back to this stage.
                if (angular.isDefined(item.gone)) {
                    item = _.omit(item, 'gone');
                }

                return _.extend(item, _.find(newItems._items, {_id: item._id}));
            }
        });

        return scopeItems;
    };
}
