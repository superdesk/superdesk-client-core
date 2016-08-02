var PARAMETERS = Object.freeze({
    unique_name: 'Unique Name',
    original_creator: 'Creator',
    from_desk: 'From Desk',
    to_desk: 'To Desk',
    spike: 'In Spiked',
    subject: 'Subject',
    company_codes: 'Company Codes'
});

SearchService.$inject = ['$location', 'gettext', 'config', 'session'];
function SearchService($location, gettext, config, session) {
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
     * Single query instance
     */
    function Query(_params) {
        var size,
            filters = [],
            post_filters = [],
            params = {};

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

        // Prepares search date in YYYY-MM-DD format
        function formatDate(date) {
            return moment(date, config.view.dateformat).format('YYYY-MM-DD');
        }

        function buildFilters(params, query) {

            //created & modified date filters
            if (params.beforefirstcreated || params.afterfirstcreated ||
                params.beforeversioncreated || params.afterversioncreated) {
                var range = {firstcreated: {}, versioncreated: {}};

                if (params.beforefirstcreated) {
                    range.firstcreated.lte = formatDate(params.beforefirstcreated);
                }

                if (params.afterfirstcreated) {
                    range.firstcreated.gte = formatDate(params.afterfirstcreated);
                }

                if (params.beforeversioncreated) {
                    range.versioncreated.lte = formatDate(params.beforeversioncreated);
                }

                if (params.afterversioncreated) {
                    range.versioncreated.gte = formatDate(params.afterversioncreated);
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
        return config.feature && config.feature.elasticHighlight ? 1 : 0;
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
                return _.extend(item, _.find(newItems._items, {_id: item._id}));
            }
        });

        return scopeItems;
    };
}

TagService.$inject = ['$location', 'desks', 'userList', 'metadata', 'search', 'gettextCatalog'];
function TagService($location, desks, userList, metadata, search, gettextCatalog) {
    var tags = {};
    tags.selectedFacets = {};
    tags.selectedParameters = [];
    tags.selectedKeywords = [];
    tags.currentSearch = {};

    var FacetKeys = {
        'type': 1,
        'category': 1,
        'urgency': 1,
        'priority': 1,
        'source': 1,
        'credit': 1,
        'desk': 1,
        'genre': 1,
        'legal': 1,
        'sms': 1
    };

    var cvs = search.cvs;

    function initSelectedParameters (parameters) {
        tags.selectedParameters = [];
        while (parameters.indexOf(':') > 0 &&
               parameters.indexOf(':') < parameters.indexOf('(', parameters.indexOf(':')) &&
               parameters.indexOf(':') < parameters.indexOf(')', parameters.indexOf(':'))) {

            var colonIndex = parameters.indexOf(':');
            var parameter = parameters.substring(parameters.lastIndexOf(' ', colonIndex), parameters.indexOf(')', colonIndex) + 1);
            var added = false;

            for (var i = 0; i < cvs.length; i++) {
                var cv = cvs[i];
                if (parameter.indexOf(cv.id + '.qcode') !== -1) {
                    var value = parameter.substring(parameter.indexOf('(') + 1, parameter.lastIndexOf(')')),
                        codeList = metadata.values[cv.list],
                        name = _.result(_.find(codeList, {qcode: value}), 'name');
                    if (name) {
                        tags.selectedParameters.push(cv.id + '.name:(' + name + ')');
                        added = true;
                    }
                }
            }

            if (!added) {
                //work with param to add translation
                var paramArr = parameter.split(':');
                var parameterTranslated = gettextCatalog.getString(paramArr[0]) + ':' + paramArr[1];
                tags.selectedParameters.push(parameterTranslated);
            }

            parameters = parameters.replace(parameter, '');
        }

        return parameters;
    }

    /*
     * function to parse search input from the search bar.
     */
    function initSelectedKeywords (keywords) {
        tags.selectedKeywords = [];
        while (keywords.indexOf('(') >= 0 && keywords.indexOf(')') > 0) {
            var closeIndex = keywords.indexOf('(');
            var counter = 1;
            while (counter > 0 && closeIndex < keywords.length) {
                var c = keywords[++closeIndex];
                if (c === '(') {
                    counter++;
                } else if (c === ')') {
                    counter--;
                }
            }
            var keyword = keywords.substring(keywords.indexOf('('), closeIndex + 1);
            tags.selectedKeywords.push(keyword);
            keywords = keywords.replace(keyword, '');
        }
    }

    function initParameters(params) {
        _.each(PARAMETERS, function(value, key) {
            if (angular.isDefined(params[key])) {
                switch (key) {
                    case 'original_creator':
                        userList.getUser(params[key]).then(function(user) {
                            tags.selectedParameters.push(value + ':' + user.display_name);
                        }, function(error) {
                            tags.selectedParameters.push(value + ':Unknown');
                        });
                        break;
                    case 'from_desk':
                    case 'to_desk':
                        tags.selectedParameters.push(value + ':' +
                            desks.deskLookup[params[key].split('-')[0]].name);
                        break;
                    case 'company_codes':
                    case 'subject':
                        var processSelectedItems = function (selectedItems, codeList) {
                            _.forEach(selecteditems, function(selecteditem) {
                                var name = _.result(_.find(codeList, {qcode: selecteditem}), 'name');
                                if (name) {
                                    tags.selectedParameters.push(value + ':(' + name + ')');
                                }
                            });
                        };
                        for (var i = 0; i < cvs.length; i++) {
                            var cv = cvs[i];
                            if (cv.field === key) {
                                var codeList = metadata.values[cv.list];
                                var selecteditems = JSON.parse(params[key]);
                                processSelectedItems(selecteditems, codeList);
                            }
                        }
                        break;
                    case 'spike':
                        if (params[key]) {
                            tags.selectedParameters.push(value);
                        }
                        break;
                    default:
                        tags.selectedParameters.push(value + ':' + params[key]);
                }
            }
        });
    }

    function removeFacet (type, key) {
        if (key.indexOf('Last') >= 0) {
            removeDateFacet();
        } else {
            var search = $location.search();
            if (search[type]) {
                var keys = JSON.parse(search[type]);
                keys.splice(keys.indexOf(key), 1);
                if (keys.length > 0)
                {
                    $location.search(type, JSON.stringify(keys));
                } else {
                    $location.search(type, null);
                }
                if (type === 'credit') {
                    $location.search('creditqcode', null);
                }
            }
        }
    }

    function removeDateFacet () {
        var search = $location.search();
        if (search.after) {
            $location.search('after', null);
        } else if (search.scheduled_after) {
            $location.search('scheduled_after', null);
        }
    }

    function initSelectedFacets () {
        return desks.initialize().then(function(result) {
            tags.selectedFacets = {};
            tags.selectedParameters = [];
            tags.selectedKeywords = [];
            tags.currentSearch = $location.search();

            var parameters = tags.currentSearch.q;
            if (parameters) {
                var keywords = initSelectedParameters(parameters);
                initSelectedKeywords(keywords);
            }

            initParameters(tags.currentSearch);

            _.forEach(tags.currentSearch, function(type, key) {
                if (key !== 'q') {
                    tags.selectedFacets[key] = [];

                    if (key === 'desk') {
                        var selectedDesks = JSON.parse(type);
                        _.forEach(selectedDesks, function(selectedDesk) {
                            tags.selectedFacets[key].push(desks.deskLookup[selectedDesk].name);
                        });
                    } else if (key === 'after') {

                        if (type === 'now-24H') {
                            tags.selectedFacets.date = ['Last Day'];
                        } else if (type === 'now-1w'){
                            tags.selectedFacets.date = ['Last Week'];
                        } else if (type === 'now-1M'){
                            tags.selectedFacets.date = ['Last Month'];
                        }
                    } else if (key === 'scheduled_after') {
                        if (type === 'now-8H') {
                            tags.selectedFacets.date = ['Scheduled in the Last 8 Hours'];
                        } else {
                            tags.selectedFacets.date = ['Scheduled in the Last Day'];
                        }
                    } else if (FacetKeys[key]) {
                        tags.selectedFacets[key] = JSON.parse(type);
                    }
                }
            });

            return tags;
        });
    }

    return {
        initSelectedFacets: initSelectedFacets,
        removeFacet: removeFacet
    };
}

SavedSearchService.$inject = ['api', '$filter', '$q'];
function SavedSearchService(api, $filter, $q){

    var _getAll = function(endPoint, page, items, params) {
        page = page || 1;
        items = items || [];
        params = params || {};

        return api(endPoint, params)
        .query({max_results: 200, page: page})
        .then(function(result) {
            items = items.concat(result._items);
            if (result._links.next) {
                page++;
                return _getAll(endPoint, page, items, params);
            }
            return $filter('sortByName')(items);
        });
    };

    this.savedSearches = null;
    this.savedSearchLookup = null;

    this.getAllSavedSearches = function(page, items) {
        var self = this;

        if (self.savedSearches) {
            return $q.when(self.savedSearches);
        }

        return _getAll('all_saved_searches', page, items)
        .then(function(savedSearches) {
            self.savedSearches = savedSearches;
            self.savedSearchLookup = {};
            _.each(savedSearches, function(item) {
                self.savedSearchLookup[item._id] = item;
            });
            return savedSearches;
        });
    };

    this.getUserSavedSearches = function(userId, page, items) {
        return _getAll('saved_searches', page, items, userId);
    };

    this.resetSavedSearches = function() {
        this.savedSearches = null;
        this.savedSearchLookup = null;
    };
}

angular.module('superdesk.search', [
    'superdesk.api',
    'superdesk.desks',
    'superdesk.activity',
    'superdesk.list',
    'superdesk.keyboard',
    'superdesk.search.react'
])
    .service('search', SearchService)
    .service('savedSearch', SavedSearchService)
    .service('tags', TagService)
    .controller('MultiActionBar', MultiActionBarController)

    /**
     * A directive that generates the sidebar containing search results
     * filters (so-called "aggregations" in Elastic's terms).
     */
    .directive('sdSearchPanel', ['$location', 'desks', 'privileges', 'tags', 'asset', 'metadata', '$rootScope',
        function($location, desks, privileges, tags, asset, metadata, $rootScope) {
        desks.initialize();
        return {
            require: '^sdSearchContainer',
            templateUrl: asset.templateUrl('superdesk-search/views/search-panel.html'),
            scope: {
                items: '=',
                desk: '=',
                repo: '=',
                context: '='
            },
            link: function(scope, element, attrs, controller) {
                scope.flags = controller.flags;
                scope.sTab = 'advancedSearch';
                scope.innerTab = 'parameters';
                scope.editingSearch = false;
                scope.showSaveSearch = false;

                scope.aggregations = {};
                scope.privileges = privileges.privileges;
                scope.search_config = metadata.search_config;

                scope.$on('edit:search', function(event, args)  {
                    scope.sTab = 'advancedSearch';
                    scope.innerTab = 'parameters';
                    scope.activateSearchPane = false;
                    scope.editingSearch = args;
                    scope.edit = _.create(scope.editingSearch) || {};
                });

                scope.changeTab = function(tabName) {
                    scope.sTab = tabName;
                };

                scope.display = function(tabName) {
                    scope.innerTab = tabName;
                    if (tabName === 'filters') {
                        $rootScope.aggregations = 1;
                        $rootScope.$broadcast('aggregations:changed');
                    } else {
                        $rootScope.aggregations = 0;
                    }
                };

                scope.searching = function() {
                    return !_.isEmpty($location.search());
                };

                scope.closeFacets = function() {
                    scope.flags.facets = false;
                    $rootScope.aggregations = 0;
                };

                var initAggregations = function () {
                    scope.aggregations = {
                        'type': {},
                        'desk': {},
                        'date': {},
                        'source': {},
                        'credit': {},
                        'category': {},
                        'urgency': {},
                        'priority': {},
                        'genre': {},
                        'legal': {},
                        'sms': {}
                    };
                };

                initAggregations();

                scope.$watch('items', function() {
                    tags.initSelectedFacets().then(function(currentTags) {
                        scope.tags = currentTags;

                        if (!scope.items || scope.items._aggregations === undefined) {
                            return;
                        }

                        initAggregations();

                        if (angular.isDefined(scope.items._aggregations.type)) {
                            _.forEach(scope.items._aggregations.type.buckets, function(type) {
                                scope.aggregations.type[type.key] = type.doc_count;
                            });
                        }

                        if (angular.isDefined(scope.items._aggregations.category)) {
                            _.forEach(scope.items._aggregations.category.buckets, function(cat) {
                                if (cat.key !== '') {
                                    scope.aggregations.category[cat.key] = cat.doc_count;
                                }
                            });
                        }

                        if (angular.isDefined(scope.items._aggregations.genre)) {
                            _.forEach(scope.items._aggregations.genre.buckets, function(g) {
                                if (g.key !== '') {
                                    scope.aggregations.genre[g.key] = g.doc_count;
                                }
                            });
                        }

                        if (angular.isDefined(scope.items._aggregations.urgency))
                        {
                            _.forEach(scope.items._aggregations.urgency.buckets, function(urgency) {
                                scope.aggregations.urgency[urgency.key] = urgency.doc_count;
                            });
                        }

                        if (angular.isDefined(scope.items._aggregations.priority)) {
                            _.forEach(scope.items._aggregations.priority.buckets, function(priority) {
                                scope.aggregations.priority[priority.key] = priority.doc_count;
                            });
                        }

                        if (angular.isDefined(scope.items._aggregations.source)) {
                            _.forEach(scope.items._aggregations.source.buckets, function(source) {
                                scope.aggregations.source[source.key] = source.doc_count;
                            });
                        }

                        if (angular.isDefined(scope.items._aggregations.credit)) {
                            _.forEach(scope.items._aggregations.credit.buckets, function(credit) {
                                scope.aggregations.credit[credit.key] = {'count': credit.doc_count, 'qcode': credit.qcode};
                            });
                        }

                        if (angular.isDefined(scope.items._aggregations.desk)) {
                            _.forEach(scope.items._aggregations.desk.buckets, function(desk) {
                                var lookedUpDesk = desks.deskLookup[desk.key];

                                if (typeof lookedUpDesk === 'undefined') {
                                    var msg =  [
                                        'Desk (key: ', desk.key, ') not found in ',
                                        'deskLookup, probable storage inconsistency.'
                                    ].join('');
                                    console.warn(msg);
                                    return;
                                }

                                scope.aggregations.desk[lookedUpDesk.name] = {
                                        count: desk.doc_count,
                                        id: desk.key
                                    };
                            });
                        }

                        if (angular.isDefined(scope.items._aggregations.legal)) {
                            _.forEach(scope.items._aggregations.legal.buckets, function(l) {
                                if (l.key === 'T' && l.doc_count > 0) {
                                    scope.aggregations.legal = {count: l.doc_count};
                                }
                            });
                        }

                        if (angular.isDefined(scope.items._aggregations.sms)) {
                            _.forEach(scope.items._aggregations.sms.buckets, function(l) {
                                if (l.key === 'T' && l.doc_count > 0) {
                                    scope.aggregations.sms = {count: l.doc_count};
                                }
                            });
                        }

                    });
                });

                scope.$watch('tags.currentSearch', function(currentSearch) {
                    scope.showSaveSearch = _.isEmpty(currentSearch) ? false : true;
                }, true);

                scope.toggleFilter = function(type, key) {
                    if (scope.hasFilter(type, key)) {
                        scope.removeFilter(type, key);
                    } else {
                        if (type === 'date') {
                            scope.setDateFilter(key);
                        } else {
                            scope.setFilter(type, key);
                        }
                    }
                };

                scope.removeFilter = function(type, key) {
                    tags.removeFacet(type, key);
                };

                scope.setFilter = function(type, key) {
                    if (!scope.isEmpty(type) && key) {
                        var currentKeys = $location.search()[type];
                        if (currentKeys) {
                            currentKeys = JSON.parse(currentKeys);
                            currentKeys.push(key);
                            $location.search(type, JSON.stringify(currentKeys));
                        } else {
                            if (type === 'credit') {
                                $location.search('creditqcode',
                                    JSON.stringify([scope.aggregations.credit[key].qcode]));
                            }
                            $location.search(type, JSON.stringify([key]));
                        }
                    } else {
                        $location.search(type, null);
                    }
                };

                scope.setDateFilter = function(key) {
                    if (key === 'Last Day') {
                        $location.search('after', 'now-24H');
                    } else if (key === 'Last Week'){
                        $location.search('after', 'now-1w');
                    } else if (key === 'Last Month'){
                        $location.search('after', 'now-1M');
                    } else if (key === 'Scheduled Last Day'){
                        $location.search('scheduled_after', 'now-24H');
                    } else if (key === 'Scheduled Last 8Hrs') {
                        $location.search('scheduled_after', 'now-8H');
                    } else {
                        $location.search('after', null);
                        $location.search('scheduled_after', null);
                    }
                };

                scope.isEmpty = function(type) {
                    return _.isEmpty(scope.aggregations[type]);
                };

                scope.format = function (date) {
                    return date ? moment(date).format('YYYY-MM-DD') : null; // jshint ignore:line
                };

                scope.hasFilter = function(type, key) {
                    if (type === 'desk') {
                        return scope.tags.selectedFacets[type] &&
                        scope.tags.selectedFacets[type].indexOf(desks.deskLookup[key].name) >= 0;
                    }

                    return scope.tags && scope.tags.selectedFacets[type] && scope.tags.selectedFacets[type].indexOf(key) >= 0;
                };
            }
        };
    }])

    .directive('sdSearchTags', ['$location', '$route', 'tags', 'asset', 'metadata',
        function($location, $route, tags, asset, metadata) {
        return {
            scope: {},
            templateUrl: asset.templateUrl('superdesk-search/views/search-tags.html'),
            link: function(scope) {
                scope.cvs = metadata.search_cvs;

                scope.$watch(function getSearchParams() {
                    return _.omit($location.search(), ['_id', 'item', 'action']);
                }, function(newValue, oldValue) {
                    if (newValue !== oldValue) {
                        reloadTags();
                    }
                }, true);

                function init() {
                    metadata
                        .initialize()
                        .then(function () {
                            scope.metadata = metadata.values;
                        });

                    reloadTags();
                }

                function reloadTags() {
                    tags.initSelectedFacets().then(function(currentTags) {
                        scope.tags = currentTags;
                    });
                }

                init();

                scope.removeFilter = function(type, key) {
                    tags.removeFacet(type, key);
                };

                scope.removeParameter = function(param) {
                    var searchParameters = $location.search();
                    var parameterValue = param.substring(param.indexOf('(') + 1, param.lastIndexOf(')'));

                    if (searchParameters.q && searchParameters.q.indexOf(param) >= 0) {
                        searchParameters.q = searchParameters.q.replace(param, '').trim();
                        $location.search('q', searchParameters.q || null);
                        return;
                    }

                    angular.forEach(scope.cvs, function(cv) {
                        if (param.indexOf(cv.name) !== -1) {
                            var codeList = scope.metadata[cv.list];
                            var qcode = _.result(_.find(codeList, function(code) {
                                                    return code.name === parameterValue;
                                                }), 'qcode');
                            if (qcode) {
                                if (searchParameters[cv.field]) {
                                    tags.removeFacet(cv.field, qcode);
                                } else {
                                    searchParameters.q = searchParameters.q.replace(cv.id + '.qcode:(' + qcode + ')', '').trim();
                                    $location.search('q', searchParameters.q || null);
                                }
                            }
                        }
                    });
                };
            }
        };
    }])

    /**
     * Item list with sidebar preview
     */
    .directive('sdSearchResults', [
        '$location',
        'preferencesService',
        'packages',
        'asset',
        '$timeout',
        'api',
        'search',
        'session',
        'moment',
        'gettext',
        'superdesk',
        '$rootScope',
    function(
        $location,
        preferencesService,
        packages,
        asset,
        $timeout,
        api,
        search,
        session,
        moment,
        gettext,
        multi,
        $rootScope
    ) { // uff - should it use injector instead?
        var preferencesUpdate = {
            'archive:view': {
                'allowed': [
                    'mgrid',
                    'compact'
                ],
                'category': 'archive',
                'view': 'mgrid',
                'default': 'mgrid',
                'label': 'Users archive view format',
                'type': 'string'
            }
        };

        return {
            require: '^sdSearchContainer',
            templateUrl: asset.templateUrl('superdesk-search/views/search-results.html'),
            link: function(scope, elem, attr, controller) {

                var GRID_VIEW = 'mgrid',
                    LIST_VIEW = 'compact';

                var multiSelectable = (attr.multiSelectable === undefined) ? false : true;

                scope.previewingBroadcast = false;

                var criteria = search.query($location.search()).getCriteria(true),
                    oldQuery = _.omit($location.search(), '_id');

                scope.flags = controller.flags;
                scope.selected = scope.selected || {};

                scope.repo = {
                    ingest: true, archive: true,
                    published: true, archived: true,
                    search: 'local'
                };

                if ($location.search().repo &&
                    !_.intersection($location.search().repo.split(','),
                        ['archive', 'published', 'ingest', 'archived']).length) {
                    scope.repo.search = $location.search().repo;
                }

                scope.context = 'search';
                scope.$on('item:deleted:archived', itemDelete);
                scope.$on('item:fetch', queryItems);
                scope.$on('item:update', updateItem);
                scope.$on('item:deleted', queryItems);
                scope.$on('item:spike', scheduleIfShouldUpdate);
                scope.$on('item:unspike', scheduleIfShouldUpdate);
                scope.$on('item:duplicate', queryItems);
                scope.$on('ingest:update', queryItems);
                scope.$on('content:update', queryItems);
                scope.$on('item:move', scheduleIfShouldUpdate);

                scope.$on('$routeUpdate', function(event, data) {
                    scope.scrollTop = 0;
                    data.force = true;
                    scope.showRefresh = false;
                    queryItems(event, data);
                });

                scope.$on('aggregations:changed', queryItems);

                scope.$on('broadcast:preview', function(event, args) {
                    scope.previewingBroadcast = true;
                    scope.preview(args.item);
                });

                scope.$on('broadcast:created', function(event, args) {
                    scope.previewingBroadcast = true;
                    queryItems();
                    scope.preview(args.item);
                });

                scope.$watch('selected', function(newVal, oldVal) {
                    if (!newVal && scope.previewingBroadcast) {
                        scope.previewingBroadcast = false;
                    }
                });

                scope.$watch(function getSearchParams() {
                    return _.omit($location.search(), '_id');
                }, function(newValue, oldValue) {
                    if (newValue !== oldValue) {
                        queryItems();
                    }
                }, true);

                // public api - called by list when needed
                scope.fetchNext = function() {
                    render(null, true);
                };

                var nextUpdate;

                function updateItem(e, data) {
                    var item = _.find(scope.items._items, {_id: data.item._id});
                    if (item) {
                        angular.extend(item, data.item);
                    }
                }

                /**
                 * Schedule an update if it's not there yet
                 */
                function queryItems(event, data) {
                    if (!nextUpdate) {
                        nextUpdate = $timeout(function() {
                            _queryItems(event, data);
                            scope.$applyAsync(function() {
                                nextUpdate = null; // reset for next $digest
                            });
                        }, 300, false);
                    }
                }

                /**
                 * Function for fetching total items and filling scope for the first time.
                 */
                function _queryItems(event, data) {
                    criteria = search.query($location.search()).getCriteria(true);
                    criteria.source.size = 50;

                    // To compare current scope of items, consider fetching same number of items.
                    if (scope.items && scope.items._items.length > 50) {
                        criteria.source.size = scope.items._items.length;
                    }
                    criteria.source.from = 0;
                    scope.total = null;
                    scope.items = null;
                    criteria.aggregations = $rootScope.aggregations;
                    criteria.es_highlight = search.getElasticHighlight();
                    return api.query(getProvider(criteria), criteria).then(function (items) {
                        if (!scope.showRefresh && data && !data.force && (data.user !== session.identity._id)) {

                            var isItemPreviewing = !!scope.selected.preview;
                            var _data = {
                                newItems: items,
                                scopeItems: scope.items,
                                scrollTop: scope.scrollTop,
                                isItemPreviewing: isItemPreviewing
                            };

                            scope.showRefresh = search.canShowRefresh(_data);
                        }

                        if (!scope.showRefresh || (data && data.force)) {
                            scope.total = items._meta.total;
                            scope.$applyAsync(function() {
                                render(items, null, (data && data.force));
                            });
                        } else {
                            // update scope items only with the matching fetched items
                            scope.items = search.updateItems(items, scope.items);
                        }
                    }).finally(function() {
                        scope.loading = false;
                    });
                }

                function scheduleIfShouldUpdate(event, data) {
                    if (data && data.item && _.includes(['item:spike', 'item:unspike'], event.name)) {
                        // item was spiked/unspikes from the list
                        extendItem(data.item, {
                            gone: true,
                            _etag: data.item
                        });
                        queryItems(event, data);
                    } else if (data && data.from_stage) {
                        // item was moved from current stage
                        extendItem(data.item, {
                            gone: true,
                            _etag: data.from_stage // this must change to make it re-render
                        });
                        queryItems(event, data);
                    }
                }

                function extendItem(itemId, updates) {
                    scope.$apply(function() {
                        scope.items._items = scope.items._items.map(function(item) {
                            if (item._id === itemId) {
                                return angular.extend(item, updates);
                            }

                            return item;
                        });

                        scope.items = angular.extend({}, scope.items); // trigger a watch
                    });
                }

                scope.$on('refresh:list', function(event, group) {
                    scope.refreshList();
                });

                scope.refreshList = function() {
                    scope.$applyAsync(function () {
                        scope.scrollTop = 0;
                    });
                    scope.showRefresh = false;
                    queryItems(null, {force: true});
                };

                /*
                 * Function to get the search endpoint name based on the criteria
                 *
                 * @param {Object} criteria
                 * @returns {string}
                 */
                function getProvider(criteria) {
                    var provider = 'search';
                    if (criteria.repo && criteria.repo.indexOf(',') === -1) {
                        provider = criteria.repo;
                    }
                    if (scope.repo.search && scope.repo.search !== 'local') {
                        provider = scope.repo.search;
                    }
                    return provider;
                }

                /*
                 * Function for fetching the elements from the database
                 *
                 * @param {items}
                 */
                function render(items, next, force) {
                    scope.loading = true;
                    if (items) {
                        setScopeItems(items, force);
                    } else if (next) {
                        scope.loading = true;
                        criteria.source.from = (criteria.source.from || 0) + criteria.source.size;
                        api.query(getProvider(criteria), criteria).then(setScopeItems).finally(function() {
                            scope.loading = false;
                        });
                    } else {
                        var query = _.omit($location.search(), '_id');

                        if (!_.isEqual(_.omit(query, 'page'), _.omit(oldQuery, 'page'))) {
                            $location.search('page', null);
                        }

                        criteria = search.query($location.search()).getCriteria(true);
                        criteria.source.from = 0;
                        criteria.source.size = 50;
                        criteria.aggregations = $rootScope.aggregations;
                        criteria.es_highlight = search.getElasticHighlight();
                        scope.loading = true;
                        api.query(getProvider(criteria), criteria).then(setScopeItems).finally(function() {
                            scope.loading = false;
                        });
                        oldQuery = query;
                    }

                    function setScopeItems(items, force) {
                        scope.items = search.mergeItems(items, scope.items, next, force);
                        scope.total_records = items._meta.total;
                        scope.loading = false;
                    }
                }

                /*
                 * Function for updating list
                 * after item has been deleted
                 */
                function itemDelete(e, data) {
                    if (session.identity._id === data.user) {
                        queryItems();
                    }
                }

                scope.preview = function preview(item) {
                    if (multiSelectable) {
                        if (_.findIndex(scope.selectedList, {_id: item._id}) === -1) {
                            scope.selectedList.push(item);
                        } else {
                            _.remove(scope.selectedList, {_id: item._id});
                        }
                    }
                    scope.selected.preview = item;
                    $location.search('_id', item ? item._id : null);
                };

                scope.openLightbox = function openLightbox() {
                    scope.selected.view = scope.selected.preview;
                };

                scope.closeLightbox = function closeLightbox() {
                    scope.selected.view = null;
                };

                scope.openSingleItem = function (packageItem) {
                    packages.fetchItem(packageItem).then(function(item) {
                        scope.selected.view = item;
                    });
                };

                scope.setview = setView;

                var savedView;
                preferencesService.get('archive:view').then(function(result) {
                    savedView = result.view;
                    scope.view = (!!savedView && savedView !== 'undefined') ? savedView : 'mgrid';
                });

                scope.$on('key:v', toggleView);

                scope.$on('open:archived_kill', function(evt, item) {
                    scope.selected.archived_kill = item;
                });

                scope.$on('open:resend', function(evt, item) {
                    scope.selected.resend = item;
                });

                function setView(view) {
                    scope.view = view || 'mgrid';
                    preferencesUpdate['archive:view'].view = view || 'mgrid';
                    preferencesService.update(preferencesUpdate, 'archive:view');
                }

                function toggleView() {
                    var nextView = scope.view === LIST_VIEW ? GRID_VIEW : LIST_VIEW;
                    return setView(nextView);
                }

                /**
                 * Generates Identifier to be used by track by expression.
                 */
                scope.uuid = function(item) {
                    return search.generateTrackByIdentifier(item);
                };

                // init
                $rootScope.aggregations = 0;
                _queryItems();
            }
        };
    }])

    /**
     * Opens and manages save search panel
     */
    .directive('sdSaveSearch', ['$location', 'asset', 'api', 'session', 'notify', 'gettext', '$rootScope',
        function($location, asset, api, session, notify, gettext, $rootScope) {
        return {
            templateUrl: asset.templateUrl('superdesk-search/views/save-search.html'),
            link: function(scope, elem) {
                scope.edit = null;
                scope.activateSearchPane = false;

                scope.$on('edit:search', function(event, args)  {
                    scope.activateSearchPane = false;
                    scope.editingSearch = args;
                    scope.edit = _.create(scope.editingSearch) || {};
                });

                scope.editItem = function () {
                    scope.activateSearchPane = true;
                    scope.edit = _.create(scope.editingSearch) || {};
                };

                scope.saveas = function() {
                    scope.activateSearchPane = true;
                    scope.edit = _.clone(scope.editingSearch) || {};
                    delete scope.edit._id;
                    scope.edit.name = '';
                    scope.edit.description = '';
                };

                scope.cancel = function () {
                    scope.sTab = scope.editingSearch ? 'savedSearches' : 'advancedSearch';
                    scope.editingSearch = false;
                    scope.edit = null;
                    scope.activateSearchPane = false;
                };

                scope.clear = function() {
                    scope.editingSearch = false;
                    scope.edit = null;
                    $location.url($location.path());
                };

                scope.search = function() {
                    $rootScope.$broadcast('search:parameters');
                };

                /**
                 * Patches or posts the given search
                 */
                scope.save = function(editSearch) {

                    function onSuccess() {
                        notify.success(gettext('Search was saved successfully'));
                        scope.cancel();
                        scope.sTab = 'savedSearches';
                        scope.edit = null;
                    }

                    function onFail(error) {
                        scope.edit = null;
                        if (angular.isDefined(error.data._message)) {
                            notify.error(error.data._message);
                        } else {
                            notify.error(gettext('Error. Search could not be saved.'));
                        }
                    }

                    var search = getFilters(_.clone($location.search()));
                    editSearch.filter = {query: search};
                    var originalSearch = {};

                    if (editSearch._id) {
                        originalSearch = scope.editingSearch;
                    }

                    api('saved_searches', session.identity).save(originalSearch, editSearch).then(onSuccess, onFail);
                };

                /**
                 * Converts the integer fields: priority and urgency to objects
                 * within a given search
                 *
                 * @return {Object} the updated search object
                 */
                function getFilters(search) {
                    _.forOwn(search, function(value, key) {
                        if (_.includes(['priority', 'urgency'], key)) {
                            search[key] = JSON.parse(value);
                        }
                    });

                    return search;
                }
            }
        };
    }])

    .directive('sdItemContainer', ['$filter', 'desks', 'api', function($filter, desks, api) {
        return {
            scope: {
                item: '='
            },
            template: '<span class="location-desk-label">{{item.label}}</span> {{item.value}}',
            link: function(scope, elem) {
                if (scope.item._type !== 'ingest') {
                    if (scope.item.task && scope.item.task.desk) {
                        desks.initialize().then(function() {
                            if (desks.deskLookup[scope.item.task.desk]) {
                                scope.item.label = 'desk:';
                                scope.item.value = desks.deskLookup[scope.item.task.desk].name;
                            }
                        });
                    } else {
                        if (scope.item._type === 'archive') {
                            scope.item.label = 'location:';
                            scope.item.value = 'workspace';
                        } else {
                            if (scope.item._type === 'archived') {
                                scope.item.label = '';
                                scope.item.value = 'archived';
                            }
                        }
                    }
                }
            }
        };
    }])

    .directive('sdItemPreview', ['asset', 'storage', function(asset, storage) {
        /**
         * @description Closes the preview panel if the currently previewed
         * item is spiked / unspiked or moved.
         * @param {Object} scope - angular scope
         * @param {Object} _ - event data (unused)
         * @param {Object=} args - the item that was spiked/unspiked/moved
         */
        function shouldClosePreview(scope, _, args) {
            // if preview pane currently previewed then close
            if (_.name === 'content:update' && scope.item && args &&
                    Object.keys(args.items)[0] === scope.item._id) {
                scope.close();
            } else if (scope.item && args && args.item === scope.item._id) {
                scope.close();
            }
        }

        return {
            templateUrl: asset.templateUrl('superdesk-search/views/item-preview.html'),
            scope: {
                item: '=',
                close: '&',
                openLightbox: '=',
                openSingleItem: '=',
                hideActionsMenu: '=',
                showHistoryTab: '='
            },
            link: function(scope) {
                scope.tab = 'content';

                scope.toggleLeft = JSON.parse(storage.getItem('shiftLeft'));

                /**
                 * Toggle preview pane position - left or right
                 * available only when screen size is smaller and authoring is open.
                 */
                scope.shiftPreview = function () {
                    scope.$applyAsync(function() {
                        scope.toggleLeft = !scope.toggleLeft;
                        storage.setItem('shiftLeft', scope.toggleLeft);
                    });
                };

                scope.$watch('item', function(item) {
                    scope.selected = {preview: item || null};
                });

                scope.$on('item:spike', shouldClosePreview.bind(this, scope));
                scope.$on('item:unspike', shouldClosePreview.bind(this, scope));
                scope.$on('item:move', shouldClosePreview.bind(this, scope));
                scope.$on('content:update', shouldClosePreview.bind(this, scope));

                /**
                 * Return true if the menu actions from
                 * preview should be hidden
                 *
                 * @return {boolean}
                 */
                scope.hideActions = function () {
                    return scope.hideActionsMenu;
                };
            }
        };
    }])

    /**
     * Open Item dialog
     */
    .directive('sdItemGlobalsearch', ['superdesk', 'session', '$location', 'search', 'api', 'notify',
        'gettext', 'keyboardManager', 'asset', 'authoringWorkspace', 'authoring',
        function(superdesk, session, $location, search, api, notify, gettext, keyboardManager, asset, authoringWorkspace, authoring) {
        return {
            scope: {repo: '=', context: '='},
            templateUrl: asset.templateUrl('superdesk-search/views/item-globalsearch.html'),
            link: function(scope, elem) {

                var ENTER = 13;
                var ESC = 27;
                scope.meta = {};
                scope.flags = {enabled: false};
                keyboardManager.bind('ctrl+0', function() {
                    scope.flags.enabled = true;
                }, {global: true});
                keyboardManager.bind('esc', function() {
                    scope.flags.enabled = false;
                }, {global: true});

                scope.$on('$destroy', function() {
                    keyboardManager.unbind('ctrl+0');
                    keyboardManager.unbind('esc');
                });

                function reset() {
                    scope.meta.unique_name = '';
                }

                function openItem(items) {
                    if (items.length > 0) {
                        reset();
                        scope.flags.enabled = false;
                        if (authoring.itemActions(items[0]).edit) {
                            authoringWorkspace.edit(items[0]);
                        } else {
                            authoringWorkspace.view(items[0]);
                        }
                    } else {
                        notify.error(gettext('Item not found...'));
                        scope.flags.enabled = true;
                    }
                }
                function searchUserContent(criteria) {
                    var resource = api('user_content', session.identity);
                    resource.query(criteria).then(function(result) {
                        openItem(result._items);
                    }, function(response) {
                        scope.message = gettext('There was a problem, item can not open.');
                    });
                }
                function fetchItem() {
                    var filter = [
                        {not: {term: {state: 'spiked'}}},
                        {bool:
                        {should: [{term: {unique_name: scope.meta.unique_name}},
                                {term: {_id: scope.meta.unique_name}},
                                {term: {guid: scope.meta.unique_name}},
                                {term: {item_id: scope.meta.unique_name}}
                            ]}
                        }
                    ];
                    var criteria = {
                        repo: 'archive,published,archived',
                        source: {
                            query: {filtered: {filter: {
                                and: filter
                            }}}
                        }
                    };
                    api.query('search', criteria).then(function(result) {
                        scope.items = result._items;
                        if (scope.items.length > 0) {
                            openItem(scope.items);
                            reset();
                        } else {
                            searchUserContent(criteria);
                        }
                    }, function(response) {
                        scope.message = gettext('There was a problem, item can not open.');
                    });
                }

                scope.search = function() {
                    fetchItem();
                };
                scope.openOnEnter = function($event) {
                    if ($event.keyCode === ENTER) {
                        scope.search();
                        $event.stopPropagation();
                    }
                    if ($event.keyCode === ESC) {
                        _closeDialog();
                    }
                };

                scope.close = function() {
                    _closeDialog();
                };

                function _closeDialog() {
                    reset();
                    scope.flags.enabled = false;
                }
            }
        };
    }])
    /**
     * Item search component
     */
    .directive('sdItemSearchbar', ['$location', '$document', 'asset', function($location, $document, asset) {
        return {
            templateUrl: asset.templateUrl('superdesk-search/views/item-searchbar.html'),
            link: function(scope, elem) {
                var ENTER = 13;

                scope.focused = false;
                var input = elem.find('#search-input');

                scope.searchOnEnter = function($event) {
                    if ($event.keyCode === ENTER) {
                        scope.search();
                        $event.stopPropagation();
                    }
                };

                scope.search = function () {
                    var output = '';

                    if (scope.query) {
                        var newQuery = _.uniq(scope.query.split(/[\s,]+/));
                        _.each(newQuery, function (item, key) {
                            if (item) {
                                output += key !== 0 ? ' (' + item + ')' : '(' + item + ')';
                            }
                        });

                        scope.query = newQuery.join(' ');
                    }
                    $location.search('q', output || null);
                };

                scope.cancel = function() {
                    scope.query = null;
                    scope.search();
                    input.focus();
                    //to be implemented
                };

                //initial query
                var srch = $location.search();
                if (srch.q && srch.q !== '') {
                    scope.query = srch.q.replace(/[()]/g, '');
                } else {
                    scope.query = null;
                }

                function closeOnClick() {
                    scope.$applyAsync(function() {
                        scope.focused = false;
                    });
                }

                $document.bind('click', closeOnClick);

                scope.$on('$destroy', function() {
                    $document.unbind('click', closeOnClick);
                });

            }
        };
    }])

    .directive('sdItemRepo', ['$location', '$timeout', 'asset', 'api', 'tags', 'search', 'metadata',
        'desks', 'userList', 'searchProviderService', '$filter', 'gettext',
        function($location, $timeout, asset, api, tags, search, metadata, desks,
                 userList, searchProviderService, $filter, gettext) {
            return {
                scope: {
                    repo: '=',
                    context: '='
                },
                templateUrl: asset.templateUrl('superdesk-search/views/item-repo.html'),
                link: function(scope, elem) {

                    /*
                     * function to initialize default values on init or search provider change
                     */
                    scope.setDefaultValues = function() {
                        if (scope.repo && scope.repo.search && scope.repo.search.indexOf('scanpix') === 0) {
                            scope.meta.scanpix_subscription = scope.scanpix_subscriptions[0].name;
                        }
                    };

                    /*
                     * init function to setup the directive initial state and
                     * called by $locationChangeSuccess event
                     */
                    function init() {
                        var params = $location.search();
                        scope.query = params.q;

                        scope.search_config = metadata.search_config;
                        scope.scanpix_subscriptions = [{
                            name: 'subscription',
                            label: gettext('inside subscription'),
                        }, {
                            name: 'all',
                            label: gettext('all photos'),
                        }];

                        searchProviderService.getAllowedProviderTypes().then(function(providerTypes) {
                            scope.searchProviderTypes = providerTypes;
                        });

                        if (params.repo) {
                            var param_list = params.repo.split(',');
                            scope.repo.archive = param_list.indexOf('archive') >= 0;
                            scope.repo.ingest = param_list.indexOf('ingest') >= 0;
                            scope.repo.published = param_list.indexOf('published') >= 0;
                            scope.repo.archived = param_list.indexOf('archived') >= 0;
                        } else {
                            // No repo is selected so reset the repos
                            scope.repo = {
                                ingest: true, archive: true,
                                published: true, archived: true,
                                search: 'local'
                            };
                        }

                        if (!scope.repo) {
                            scope.repo = {'search': 'local'};
                        } else {
                            if (!scope.repo.archive && !scope.repo.ingest &&
                                !scope.repo.published && !scope.repo.archived) {
                                scope.repo.search = params.repo;
                            } else {
                                scope.repo.search = 'local';
                            }
                        }

                        scope.setDefaultValues();
                        fetchProviders(params);
                    }

                    init();

                    /*
                     * Initialize the search providers
                     */
                    function fetchProviders(params) {
                        return api.search_providers.query({max_results: 200})
                            .then(function(result) {
                                scope.providers = $filter('sortByName')(result._items, 'search_provider');
                                setDefaultSearch(params);
                            });
                    }

                    function setDefaultSearch(params) {
                        if (scope.providers.length > 0 && (!params || !params.repo)) {
                            scope.providers.forEach(function(provider, index, array) {
                                if (provider.is_default) {
                                    scope.repo = {'search': provider.source};
                                }
                            });
                        }
                    }

                    function getActiveRepos() {
                        var repos = [];

                        if (scope.repo.search === 'local') {
                            angular.forEach(scope.repo, function(val, key) {
                                if (val && val !== 'local') {
                                    repos.push(key);
                                }
                            });

                            return repos.length ? repos.join(',') : null;

                        } else {
                            return scope.repo.search;
                        }
                    }

                    scope.$on('$locationChangeSuccess', function() {
                        if (getActiveRepos() !== $location.search().repo) {
                            init();
                        }
                    });

                    scope.isDefault = function(provider) {
                        return scope.repo && scope.repo.search && provider.source && scope.repo.search === provider.source;
                    };

                    scope.toggleRepo = function(repoName) {
                        scope.repo[repoName] = !scope.repo[repoName];
                        $location.search('repo', getActiveRepos());
                    };
                }
            };
        }
    ])

    .directive('sdSearchParameters', ['$location', '$timeout', 'asset', 'api', 'tags', 'search', 'metadata',
        'desks', 'userList', 'searchProviderService', '$filter', 'gettext',
        function($location, $timeout, asset, api, tags, search, metadata, desks,
                 userList, searchProviderService, $filter, gettext) {
            return {
                scope: {
                    repo: '=',
                    context: '='
                },
                templateUrl: asset.templateUrl('superdesk-search/views/search-parameters.html'),
                link: function(scope, elem) {

                    var input = elem.find('#search-input');

                    var ENTER = 13;

                    var inputField = elem.find('input[type="text"]');

                    inputField.on('keydown', function(event) {
                        if (event.keyCode === ENTER) {
                            event.preventDefault();
                        }
                    });

                    /*
                     * init function to setup the directive initial state and called by $locationChangeSuccess event
                     * @param {boolean} load_data.
                     */
                    function init(load_data) {
                        var params = $location.search();
                        scope.query = params.q;
                        scope.flags = false;
                        scope.meta = {};
                        scope.fields = {};
                        scope.cvs = metadata.search_cvs;
                        scope.search_config = metadata.search_config;
                        scope.scanpix_subscriptions = [{
                            name: 'subscription',
                            label: gettext('inside subscription'),
                        }, {
                            name: 'all',
                            label: gettext('all photos'),
                        }];
                        scope.lookupCvs = {};
                        angular.forEach(scope.cvs, function(cv) {
                            scope.lookupCvs[cv.id] = cv;
                        });

                        if ($location.search().unique_name) {
                            scope.fields.unique_name = $location.search().unique_name;
                        }

                        if ($location.search().spike) {
                            scope.fields.spike = true;
                        }

                        if (load_data) {
                            fetchMetadata();
                            fetchUsers();
                            fetchDesks();
                        } else {
                            initializeDesksDropDown();
                            initializeItems();
                        }
                    }

                    init(true);

                    /*
                     * Initialize the creator drop down selection.
                     */
                    function fetchUsers() {
                        userList.getAll()
                        .then(function(result) {
                            scope.userList = {};
                            _.each(result, function(user) {
                                scope.userList[user._id] = user;
                            });

                            if ($location.search().original_creator) {
                                scope.fields.original_creator = $location.search().original_creator;
                            }
                        });
                    }

                    /*
                     * Initialize the desk drop down
                     */
                    function fetchDesks() {
                        scope.desks = [];
                        desks.initialize()
                            .then(function() {
                                scope.desks = desks.desks;
                                initializeDesksDropDown();
                            });
                    }

                    /*
                     *  Initialize Desks DropDown
                     */
                    function initializeDesksDropDown() {
                        if (scope.desks && scope.desks._items) {
                            initFromToDesk($location.search().from_desk, 'from_desk');
                            initFromToDesk($location.search().to_desk, 'to_desk');
                        }
                    }

                    function initializeItems() {
                        angular.forEach(scope.cvs, function(cv) {
                            if ($location.search()[cv.field]) {
                                scope.selecteditems[cv.id] = [];
                                var itemList = JSON.parse($location.search()[cv.field]);
                                angular.forEach(itemList, function(qcode) {
                                    var match = _.find(scope.metadata[cv.list], function(m) {
                                        return m.qcode === qcode;
                                    });
                                    scope.selecteditems[cv.id].push(match);
                                    scope.fields[cv.field] = [];
                                    scope.fields[cv.field].push(match);
                                });
                            } else {
                                scope.selecteditems[cv.id] = [];
                            }
                        });
                    }

                    /*
                     * initialize the desk drop down selection.
                     * @param {string} query string parameter from_desk or to_desk
                     * @param {field} scope field to be updated.
                     */
                    function initFromToDesk(param, field) {
                        if (param) {
                            var deskParams = param.split('-');
                            if (deskParams.length === 2) {
                                scope.fields[field] = deskParams[0];
                            }
                        }
                    }

                    /*
                     * Converting to object and adding pre-selected subject codes, location, genre and service to list in left sidebar
                     */
                    function fetchMetadata() {
                        metadata
                            .initialize()
                            .then(function() {
                                scope.keywords = metadata.values.keywords;
                                return metadata.fetchSubjectcodes();
                            })
                            .then(function () {
                                scope.subjectcodes = metadata.values.subjectcodes;
                                scope.metadata = metadata.values;
                                return tags.initSelectedFacets();
                            })
                            .then(function (currentTags) {
                                scope.selecteditems = {};
                                scope.selectedCodes = {};
                                initializeItems();
                            });
                    }

                    scope.$on('$locationChangeSuccess', function() {
                        if (scope.query !== $location.search().q ||
                            scope.fields.from_desk !== $location.search().from_desk ||
                            scope.fields.to_desk !== $location.search().to_desk ||
                            scope.fields.unique_name !== $location.search().unique_name ||
                            scope.fields.original_creator !== $location.search().original_creator ||
                            scope.fields.subject !== $location.search().subject ||
                            scope.fields.company_codes !== $location.search().company_codes ||
                            scope.fields.spike !== $location.search().spike) {
                            init();
                        }
                    });

                    function getFirstKey(data) {
                        for (var prop in data) {
                            if (data.hasOwnProperty(prop)) {
                                return prop;
                            }
                        }
                    }

                    function booleanToBinaryString(bool) {
                        return Number(bool).toString();
                    }

                    /*
                     * Get Query function build the query string
                     */
                    function getQuery() {
                        var metas = [];
                        var pattern = /[()]/g;

                        angular.forEach(scope.meta, function(val, key) {
                            //checkbox boolean values.
                            if (typeof(val) === 'boolean') {
                                val = booleanToBinaryString(val);
                            }

                            if (typeof(val) === 'string') {
                                val = val.replace(pattern, '');
                            }

                            if (key === '_all') {
                                metas.push(val.join(' '));
                            } else {
                                if (val) {
                                    if (key.indexOf('scanpix_') === 0) {
                                        key = key.substring(8);
                                    }
                                    if (typeof(val) === 'string'){
                                        if (val) {
                                            metas.push(key + ':(' + val + ')');
                                        }
                                    } else if (angular.isArray(val)) {
                                        angular.forEach(val, function(value) {
                                            value = value.replace(pattern, '');
                                            metas.push(key + ':(' + value + ')');
                                        });
                                    } else {
                                        var subkey = getFirstKey(val);
                                        if (val[subkey]) {
                                            metas.push(key + '.' + subkey + ':(' + val[subkey] + ')');
                                        }
                                    }
                                }
                            }
                        });

                        angular.forEach(scope.fields, function(val, key) {
                            if (key === 'from_desk') {
                                $location.search('from_desk', getDeskParam('from_desk'));
                            } else if (key === 'to_desk') {
                                $location.search('to_desk', getDeskParam('to_desk'));
                            } else if (_.includes(['subject', 'company_codes'], key)) {
                                $location.search(key, JSON.stringify(_.map(val, 'qcode')));
                            } else {
                                $location.search(key, val);
                            }
                        });

                        if (metas.length) {
                            if (scope.query) {
                                return scope.query + ' ' + metas.join(' ');
                            } else {
                                return metas.join(' ');
                            }
                        } else {
                            return scope.query || null;
                        }

                    }

                    scope.$on('search:parameters', function openSearch() {
                        $location.search('q', getQuery() || null);
                        scope.meta = {};
                    });

                    scope.$on('key:s', function openSearch() {
                        scope.$apply(function() {
                            scope.flags = {extended: true};
                            $timeout(function() { // call focus when input will be visible
                                input.focus();
                            }, 0, false);
                        });
                    });

                    /*
                     * Get the Desk Type
                     * @param {string} field from or to
                     * @returns {string} desk querystring parameter
                     */
                    function getDeskParam(field) {
                        var deskId = '';
                        if (scope.fields[field]) {
                            deskId = scope.fields[field];
                            var desk_type = _.result(_.find(scope.desks._items, function (item) {
                                return item._id === deskId;
                            }), 'desk_type');

                            return deskId + '-' + desk_type;
                        }

                        return null;
                    }

                    /*
                     * Filter content by subject search
                     */
                    scope.itemSearch = function (items, type) {
                        if (items[type].length) {
                            scope.fields[type] = items[type];
                        } else {
                            delete scope.fields[type];
                        }
                    };

                    scope.$on('$destroy', function() {
                        inputField.off('keydown');
                    });
                }
            };
        }
    ])

    /**
     * Item sort component
     */
    .directive('sdItemSortbar', ['search', 'asset', '$location', function sortBarDirective(search, asset, $location) {
        var repos = {
            'aapmm': true,
            'paimg': true,
            // temporaty fix to have several scanpix instances (SDNTB-217)
            // FIXME: need to be refactored (SD-4448)
            'scanpix(ntbtema)': true,
            'scanpix(ntbkultur)': true,
            'scanpix(desk)': true,
            'scanpix(npk)': true
        };

        return {
            scope: {
                total: '='
            },
            templateUrl: asset.templateUrl('superdesk-search/views/item-sortbar.html'),
            link: function(scope) {
                scope.sortOptions = search.sortOptions;

                function getActive() {
                    scope.active = search.getSort();
                }

                scope.canSort = function() {
                    var criteria = search.query($location.search()).getCriteria(true);
                    return !(angular.isDefined(criteria.repo) && repos[criteria.repo]);
                };

                scope.sort = function sort(field) {
                    search.setSort(field);
                };

                scope.toggleDir = function toggleDir($event) {
                    search.toggleSortDir();
                };

                scope.$on('$routeUpdate', getActive);
                getActive();
            }
        };
    }])

    .directive('sdSavedSearchSelect', ['api', 'session', 'savedSearch',
        function SavedSearchSelectDirective(api, session, savedSearch) {
        return {
            link: function(scope) {
                savedSearch.getUserSavedSearches(session.identity).then(function(res) {
                    scope.searches = res;
                });
            }
        };
    }])

    .directive('sdSavedSearches', ['$rootScope', 'api', 'session', 'modal', 'notify', 'gettext', 'asset',
                                   '$location', 'desks', 'privileges', 'search', 'savedSearch',
    function($rootScope, api, session, modal, notify, gettext, asset, $location, desks, privileges, search, savedSearch) {
        return {
            templateUrl: asset.templateUrl('superdesk-search/views/saved-searches.html'),
            scope: {},
            link: function(scope) {

                var resource = api('saved_searches', session.identity);
                scope.selected = null;
                scope.searchText = null;
                scope.userSavedSearches = [];
                scope.globalSavedSearches = [];
                scope.privileges = privileges.privileges;
                var originalUserSavedSearches = [];
                var originalGlobalSavedSearches = [];

                desks.initialize()
                .then(function() {
                    scope.userLookup = desks.userLookup;
                });

                function initSavedSearches() {
                    savedSearch.getUserSavedSearches(session.identity).then(function(searches) {
                        scope.userSavedSearches.length = 0;
                        scope.globalSavedSearches.length = 0;
                        scope.searches = searches;
                        _.forEach(scope.searches, function(savedSearch) {
                            savedSearch.filter.query = search.setFilters(savedSearch.filter.query);
                            if (savedSearch.user === session.identity._id) {
                                scope.userSavedSearches.push(savedSearch);
                            } else if (savedSearch.is_global) {
                                scope.globalSavedSearches.push(savedSearch);
                            }
                        });
                        originalUserSavedSearches = _.clone(scope.userSavedSearches);
                        originalGlobalSavedSearches = _.clone(scope.globalSavedSearches);
                    });
                }

                initSavedSearches();

                scope.select = function(search) {
                    scope.selected = search;
                    $location.search(search.filter.query);
                };

                scope.edit = function(search) {
                    scope.select(search);
                    $rootScope.$broadcast('edit:search', search);
                };

                /**
                 * Filters the content of global and user filters
                 *
                 */
                scope.filter = function() {
                    scope.userSavedSearches = _.clone(originalUserSavedSearches);
                    scope.globalSavedSearches = _.clone(originalGlobalSavedSearches);

                    if (scope.searchText || scope.searchText !== '') {
                        scope.userSavedSearches = _.filter(originalUserSavedSearches, function(n) {
                            return n.name.toUpperCase().indexOf(scope.searchText.toUpperCase()) >= 0;
                        });

                        scope.globalSavedSearches = _.filter(originalGlobalSavedSearches, function(n) {
                            return n.name.toUpperCase().indexOf(scope.searchText.toUpperCase()) >= 0;
                        });
                    }
                };

                scope.remove = function(searches) {
                    modal.confirm(
                        gettext('Are you sure you want to delete saved search?')
                    )
                    .then(function() {
                        resource.remove(searches).then(function() {
                            notify.success(gettext('Saved search removed'));
                            initSavedSearches();
                        }, function() {
                            notify.error(gettext('Error. Saved search not deleted.'));
                        });
                    });
                };

            }
        };
    }])

    .directive('sdSearchContainer', function() {
        return {
            controller: ['$scope', '$location', function SearchContainerController($scope, $location) {
                this.flags = $scope.flags || {};
                var query = _.omit($location.search(), '_id');
                this.flags.facets = !_.isEmpty(query);
            }]
        };
    })

    .directive('sdMultiActionBar', ['asset', 'multi', 'authoringWorkspace', 'superdesk',
    function(asset, multi, authoringWorkspace, superdesk) {
        return {
            controller: 'MultiActionBar',
            controllerAs: 'action',
            templateUrl: asset.templateUrl('superdesk-search/views/multi-action-bar.html'),
            scope: true,
            link: function(scope) {
                scope.multi = multi;
                scope.$watch(multi.getItems, detectType);
                scope.$on('item:lock', function(_e, data) {
                    if (_.includes(multi.getIds(), data.item)) {
                        // locked item is in the selections so update lock info
                        var selectedItems = multi.getItems();
                        _.find(selectedItems, function(_item) {
                            return _item._id === data.item;
                        }).lock_user = data.user;
                        detectType(selectedItems);
                    }
                });

                scope.isOpenItemType = function(type) {
                    var openItem = authoringWorkspace.getItem();
                    return openItem && openItem.type === type;
                };

                /**
                 * Detects type of all selected items and assign it to scope,
                 * but only when it's same for all of them.
                 *
                 * @param {Array} items
                 */
                function detectType(items) {
                    var types = {};
                    var states = [];
                    var activities = {};
                    angular.forEach(items, function(item) {
                        types[item._type] = 1;
                        states.push(item.state);

                        var _activities = superdesk.findActivities({action: 'list', type: item._type}, item) || [];
                        _activities.forEach(function(activity) {
                            if (!item.lock_user) { //ignore activities if the item is locked
                                activities[activity._id] = activities[activity._id] ? activities[activity._id] + 1 : 1;
                            }
                        });
                    });

                    // keep only activities available for all items
                    Object.keys(activities).forEach(function(activity) {
                        if (activities[activity] < items.length) {
                            activities[activity] = 0;
                        }
                    });

                    var typesList = Object.keys(types);
                    scope.type = typesList.length === 1 ? typesList[0] : null;
                    scope.state = typesList.length === 1 ? states[0] : null;
                    scope.activity = activities;
                }
            }
        };
    }])

    .config(['superdeskProvider', 'assetProvider', function(superdesk, asset) {
        superdesk.activity('/search', {
            description: gettext('Find live and archived content'),
            priority: 200,
            label: gettext('Search'),
            templateUrl: asset.templateUrl('superdesk-search/views/search.html'),
            sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html'
        });
    }])

    .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
        keyboardManager.register('Search', 'ctrl + 0', gettext('Shows search modal'));
        keyboardManager.register('Search', 'v', gettext('Toggles search view'));
    }]);

MultiActionBarController.$inject = ['$rootScope', 'multi', 'multiEdit', 'send', 'remove', 'modal', '$q',
                                    'packages', 'superdesk', 'notify', 'spike', 'authoring', 'privileges', '$location'];
function MultiActionBarController($rootScope, multi, multiEdit, send, remove, modal, $q,
        packages, superdesk, notify, spike, authoring, privileges, $location) {

    this.send  = function() {
        send.all(multi.getItems());
    };

    this.sendAs = function() {
        send.allAs(multi.getItems());
    };

    this.canRemoveIngestItems = function() {
        var canRemove = true;
        multi.getItems().forEach(function(item) {
            canRemove = canRemove && remove.canRemove(item);
        });
        return canRemove;
    };

    /**
     * Remove multiple ingest items
     */
    this.removeIngestItems = function() {
        multi.getItems().forEach(function(item) {
            remove.remove(item);
        });
        multi.reset();
    };

    this.multiedit = function() {
        multiEdit.create(multi.getIds());
        multiEdit.open();
    };

    this.createPackage = function() {
        packages.createPackageFromItems(multi.getItems())
        .then(function(new_package) {
            superdesk.intent('edit', 'item', new_package);
        }, function(response) {
            if (response.status === 403 && response.data && response.data._message) {
                notify.error(gettext(response.data._message), 3000);
            }
        });
    };

    this.addToPackage = function() {
        $rootScope.$broadcast('package:addItems', {items: multi.getItems(), group: 'main'});
    };

    /**
     * Multiple item spike
     */
    this.spikeItems = function() {
        var txt = gettext('Do you want to delete these items permanently?');
        var isPersonal = $location.path() === '/workspace/personal';

        return $q.when(isPersonal ? modal.confirm(txt) : 0)
            .then(function() {
                spike.spikeMultiple(multi.getItems());
                $rootScope.$broadcast('item:spike');
                multi.reset();
            });
    };

    /**
     * Multiple item unspike
     */
    this.unspikeItems = function() {
        spike.unspikeMultiple(multi.getItems());
        $rootScope.$broadcast('item:unspike');
        multi.reset();
    };

    this.canPackageItems = function() {
        var canPackage = true;
        multi.getItems().forEach(function(item) {
            canPackage = canPackage && item._type !== 'archived' && !item.lock_user &&
                !_.includes(['ingested', 'spiked', 'killed', 'draft'], item.state);
        });
        return canPackage;
    };
}
