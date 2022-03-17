import {getParameters} from 'apps/search/constants';
import {getDateFilters} from './DateFilters';
import _ from 'lodash';

/**
 * @ngdoc directive
 * @module superdesk.apps.search
 * @name sdSearchParameters
 *
 * @requires $location
 * @requires asset
 * @requires tags
 * @requires metadata
 * @requires searchCommon
 * @requires desks
 * @requires userList
 * @requires ingestSources
 * @requires subscribersService
 *
 * @description
 *   A directive that generates search parameter form.
 */
SearchParameters.$inject = [
    '$location', 'asset', 'tags', 'metadata',
    'searchCommon', 'desks', 'userList',
    'ingestSources', 'subscribersService',
    '$templateCache', 'search',
];

export function SearchParameters($location, asset, tags, metadata, common, desks,
    userList, ingestSources, subscribersService, $templateCache, search) {
    return {
        scope: {
            repo: '=',
            context: '=',
            providerType: '=',
        },
        templateUrl: asset.templateUrl('apps/search/views/search-parameters.html'),
        link: function(scope, elem) {
            const PARAMETERS = getParameters();
            var ENTER = 13;

            scope.dateFilters = getDateFilters()
                .filter((dateFilter) => metadata.search_config?.[dateFilter.fieldname] != null);

            scope.keyPressed = function(event) {
                if (event.keyCode === ENTER) {
                    searchParameters();
                    event.preventDefault();
                }
            };

            scope.toggleDateFilter = function(fieldname, predefinedFilters) {
                predefinedFilters.forEach((filters) => {
                    if (filters.key === scope.fields[fieldname]) {
                        filters.active = !filters.active;
                        if (!filters.active) {
                            scope.fields[fieldname] = null;
                        }
                        if (scope.fields[fieldname + 'to']) {
                            scope.fields[fieldname + 'to'] = null;
                        }
                        if (scope.fields[fieldname + 'from']) {
                            scope.fields[fieldname + 'from'] = null;
                        }
                    } else {
                        filters.active = false;
                    }
                });
            };

            scope.togglePredefinedDateFilter = function(dateFilter, predefinedFilter) {
                scope.fields[dateFilter.fieldname] = predefinedFilter;
            };

            scope.clearPredefinedFilters = function(fieldname) {
                const clearDateFilter = scope.dateFilters.find((dateFilter) => dateFilter.fieldname === fieldname);

                scope.fields[fieldname] = null;
                clearDateFilter.predefinedFilters.forEach((predefinedFilter) => predefinedFilter.active = false);
            };

            const getSearchConfig = () => {
                if (scope.isContentApi()) {
                    let searchConfig: any = _.pick(metadata.search_config, ['slugline', 'headline',
                        'byline', 'story_text', 'sign_off', 'firstpublished']);

                    searchConfig.subscribers = 1;
                    return searchConfig;
                }
                return metadata.search_config;
            };

            scope.isContentApi = function() {
                return _.get(scope, 'repo.search') === 'content-api';
            };

            /*
             * init function to setup the directive initial state and called by $locationChangeSuccess event
             * @param {boolean} loadData.
             */
            function init(loadData?) {
                var params = $location.search();

                scope.query = params.q;
                scope.flags = false;
                scope.common = common;
                scope.meta = _.extend({}, common.meta);
                scope.fields = {};
                scope.selecteditems = {};
                scope.selectedCodes = {};
                scope.cvs = metadata.search_cvs;
                scope.search_config = getSearchConfig();
                scope.lookupCvs = {};
                scope.params = params.params ? JSON.parse(params.params) : {};

                if (scope.query && !Object.keys(scope.meta).length) {
                    // get selected parameters as object
                    scope.meta = tags.initSelectedParameters(scope.query, true);
                }

                angular.forEach(scope.cvs, (cv) => {
                    scope.lookupCvs[cv.id] = cv;
                });

                if ($location.search().unique_name) {
                    scope.fields.unique_name = $location.search().unique_name;
                }

                if ($location.search().spike) {
                    scope.fields.spike = $location.search().spike;
                } else if (!scope.isContentApi()) {
                    scope.fields.spike = 'exclude';
                }

                // Date filter start.

                let parameters = getDateFilters()
                    .filter((dateFilter) => metadata.search_config?.[dateFilter.fieldname] != null);
                let paramsParameters = Object.keys($location.search());

                function initialDatePublishedFromTo(fieldname) {
                    scope.fields[fieldname] = $location.search()[fieldname];
                }

                scope.dateFilters.forEach((parameter) => {
                    // 1) Initialize the scope fields for predefined buttons
                    // 2) Setting the active property for the predefined buttons.

                    if (paramsParameters.includes(parameter.fieldname)) {
                        let fieldname = $location.search()[parameter['fieldname']];
                        let _predefinedFilter = parameter.predefinedFilters
                            .find((predefinedFilter) => predefinedFilter.key === fieldname);

                        scope.fields[parameter.fieldname] = fieldname;
                        _predefinedFilter.active = true;
                    } else {
                        parameter.predefinedFilters.forEach((predefinedFilter) => {
                            predefinedFilter.active = false;
                        });
                    }

                    // Initializing the date published from to field.

                    if (paramsParameters.includes(parameter['fieldname'] + 'to')) {
                        initialDatePublishedFromTo(parameter['fieldname'] + 'to');
                    }
                    if (paramsParameters.includes(parameter['fieldname'] + 'from')) {
                        initialDatePublishedFromTo(parameter['fieldname'] + 'from');
                    }
                });

                // Date filter end.

                if ($location.search().featuremedia) {
                    scope.fields.featuremedia = true;
                }

                if (loadData) {
                    fetchMetadata();
                    if (scope.isContentApi()) {
                        fetchSubscribers();
                    } else {
                        fetchUsers();
                        fetchDesks();
                        fetchProviders();
                    }
                } else {
                    if (scope.metadata) {
                        initializeItems();
                    }
                    if (scope.isContentApi()) {
                        initializeSubscriber();
                    } else {
                        initializeDesksDropDown();
                        initializeMarkedDesks();
                        initializeProviders();
                        initializeCreators();
                    }
                }
            }

            init(true);

            /*
             * Initialize the creator drop down selection.
             */
            function fetchUsers() {
                userList.getAll()
                    .then((users) => {
                        scope.userList = users;
                        initializeCreators();
                    });
            }

            /*
             * Initialize the desk drop down
             */
            function fetchDesks() {
                scope.desks = [];
                desks.initialize()
                    .then(() => {
                        scope.desks = desks.desks;
                        initializeDesksDropDown();
                    });
            }

            function fetchSubscribers() {
                if (scope.repo.search !== 'content-api') {
                    return;
                }
                subscribersService.initialize()
                    .then(() => {
                        scope.subscribers = subscribersService.subscribers;
                        initializeSubscriber();
                    });
            }

            /*
             * Initialize the provider dropdown
             */
            function fetchProviders() {
                ingestSources.fetchAllIngestProviders().then((items) => {
                    scope.providers = items;
                    initializeProviders();
                });
            }

            function initializeProviders() {
                if ($location.search().ingest_provider) {
                    scope.fields.ingest_provider = $location.search().ingest_provider;
                }
            }

            function initializeCreators() {
                if ($location.search().original_creator) {
                    scope.fields.original_creator = $location.search().original_creator;
                }
            }

            function initializeSubscriber() {
                if ($location.search().subscriber) {
                    scope.fields.subscriber = $location.search().subscriber;
                }
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

            function initializeMarkedDesks() {
                if ($location.search().marked_desks) {
                    scope.fields.marked_desks = [];
                    scope.selecteditems.marked_desks = scope.selecteditems.marked_desks || [];
                    var markedDesks = JSON.parse($location.search().marked_desks);

                    markedDesks.map((d) => {
                        scope.selecteditems.marked_desks.push(desks.deskLookup[d]);
                        scope.fields.marked_desks.push(desks.deskLookup[d]);
                        return true;
                    });
                } else {
                    scope.selecteditems.marked_desks = [];
                }
            }

            function initializeItems() {
                angular.forEach(scope.cvs, (cv) => {
                    if ($location.search()[cv.id]) {
                        scope.fields[cv.id] = [];
                        scope.selecteditems[cv.id] = scope.selecteditems[cv.id] || [];
                        var itemList = JSON.parse($location.search()[cv.id]);

                        angular.forEach(itemList, (qcode) => {
                            var match = _.find(scope.metadata[cv.list], (m) => m.qcode === qcode);

                            if (match) {
                                scope.selecteditems[cv.id].push(angular.extend(match, {
                                    scheme: cv.id,
                                }));
                                scope.fields[cv.id].push(match);
                            }
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
             * Converting to object and adding pre-selected subject codes, location,
             * genre and service to list in left sidebar.
             */
            function fetchMetadata() {
                metadata
                    .initialize()
                    .then(() => {
                        scope.keywords = metadata.cvs.find((cv) => cv._id === 'keywords');
                        return metadata.fetchSubjectcodes();
                    })
                    .then(() => {
                        scope.subjectcodes = metadata.values.subjectcodes;
                        scope.metadata = metadata.values;
                        return tags.initSelectedFacets();
                    })
                    .then((currentTags) => {
                        initializeMarkedDesks();
                        initializeItems();
                    });
            }

            scope.$on('$locationChangeSuccess', () => {
                if (scope.query !== $location.search().q || isFieldDifferentThanSearch()) {
                    init();
                }
            });

            function isFieldDifferentThanSearch() {
                let params = $location.search();

                return _.some(_.keys(PARAMETERS), (key) => _.get(scope.fields, key) !== _.get(params, key));
            }

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

                angular.forEach(scope.meta, (val, key) => {
                    // checkbox boolean values.
                    let v = val;

                    if (typeof val === 'boolean') {
                        v = booleanToBinaryString(val);
                    }

                    if (typeof val === 'string') {
                        v = val.replace(pattern, '');
                    }

                    if (key === '_all') {
                        metas.push(v.join(' '));
                    } else if (v) {
                        let k = key;

                        if (key.indexOf('scanpix_') === 0) {
                            k = key.substring(8);
                        }
                        if (typeof v === 'string') {
                            if (v) {
                                metas.push(k + ':(' + v + ')');
                            }
                        } else if (angular.isArray(v)) {
                            angular.forEach(v, (value) => {
                                metas.push(k + ':(' + value.replace(pattern, '') + ')');
                            });
                        } else {
                            var subkey = getFirstKey(v);

                            if (v[subkey]) {
                                metas.push(k + '.' + subkey + ':(' + v[subkey] + ')');
                            }
                        }
                    }
                });

                let fields = ['subject', 'company_codes'];

                angular.forEach(scope.cvs, (cv) => {
                    fields.push(cv.id);
                });

                angular.forEach(scope.fields, (val, key) => {
                    if (key === 'from_desk') {
                        $location.search('from_desk', getDeskParam('from_desk'));
                    } else if (key === 'to_desk') {
                        $location.search('to_desk', getDeskParam('to_desk'));
                    } else if (_.includes(fields, key)) {
                        $location.search(key, JSON.stringify(_.map(val, 'qcode')));
                    } else if (key === 'marked_desks') {
                        $location.search(key, JSON.stringify(_.map(val, '_id')));
                    } else if (key === 'featuremedia') {
                        $location.search(key, val ? true : null);
                    } else {
                        $location.search(key, val);
                    }
                });

                if (metas.length) {
                    return metas.join(' ');
                }

                return null;
            }

            scope.$on('search:parameters', searchParameters);

            function searchParameters() {
                $location.search('q', getQuery());
                $location.search('params', scope.params ? JSON.stringify(scope.params) : null);
                scope.meta = {};
            }

            /*
             * Get the Desk Type
             * @param {string} field from or to
             * @returns {string} desk querystring parameter
             */
            function getDeskParam(field) {
                var deskId = '';

                if (scope.fields[field]) {
                    deskId = scope.fields[field];
                    var deskType = _.result(_.find(scope.desks._items, (item) => item._id === deskId), 'desk_type');

                    return deskId + '-' + deskType;
                }

                return null;
            }

            /*
             * Filter content by subject search
             */
            scope.itemSearch = function(items, type) {
                if (items[type].length) {
                    scope.fields[type] = items[type];
                } else {
                    delete scope.fields[type];
                }
            };

            /*
            * Functions for content Type (Belga 360)
            */
            function initializeTypes(item) {
                scope.selecteditems.types = [];
                if (item) {
                    item.forEach((keyword) => {
                        scope.selecteditems.types.push({'name': keyword, 'qcode': keyword, scheme: null});
                    });
                }
            }
            scope.setParamsTypes = function(items, type) {
                scope.params['types'] = [];
                if (items[type].length) {
                    scope.fields[type] = items[type];
                    items[type].forEach((item) => {
                        scope.params['types'].push(item.name);
                    },
                    );
                } else {
                    delete scope.params.types;
                    delete scope.fields[type];
                }
            };

            initializeTypes(scope.params['types']);

            scope.getTemplate = (providerType) => `search-panel-${providerType}.html`;

            scope.hasTemplate = (providerType) =>
                providerType != null && $templateCache.get(scope.getTemplate(providerType)) != null;

            scope.updateParams = (updates) =>
                // apply to make it work for react components
                scope.$applyAsync(() => Object.assign(scope.params, updates));
        },
    };
}
