SearchParameters.$inject = [
    '$location', 'asset', 'tags', 'metadata', 'desks', 'userList', 'gettext', 'gettextCatalog', 'ingestSources'
];
export function SearchParameters($location, asset, tags, metadata, desks, userList, gettext, gettextCatalog, ingestSources) {
    return {
        scope: {
            repo: '=',
            context: '='
        },
        templateUrl: asset.templateUrl('superdesk-search/views/search-parameters.html'),
        link: function(scope, elem) {

            var ENTER = 13;

            scope.keyPressed = function(event) {
                if (event.keyCode === ENTER) {
                    searchParameters();
                    event.preventDefault();
                }
            };

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
                    fetchProviders();
                } else {
                    initializeDesksDropDown();
                    initializeItems();
                    initializeProviders();
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
             * Initialize the provider dropdown
             */
            function fetchProviders() {
                ingestSources.fetchAllIngestProviders().then(function(items) {
                    scope.providers = items;
                    initializeProviders();
                });
            }

            function initializeProviders() {
                if ($location.search().ingest_provider) {
                    scope.fields.ingest_provider = $location.search().ingest_provider;
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

            function initializeItems() {
                angular.forEach(scope.cvs, function(cv) {
                    if ($location.search()[cv.field]) {
                        scope.fields[cv.field] = [];
                        scope.selecteditems[cv.field] = scope.selecteditems[cv.field] || [];
                        var itemList = JSON.parse($location.search()[cv.field]);
                        angular.forEach(itemList, function(qcode) {
                            var match = _.find(scope.metadata[cv.list], function(m) {
                                return m.qcode === qcode;
                            });
                            if (match) {
                                scope.selecteditems[cv.field].push(angular.extend(match, {
                                    scheme: cv.id
                                }));
                                scope.fields[cv.field].push(match);
                            }
                        });
                    } else {
                        scope.selecteditems[cv.field] = [];
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
                    scope.fields.spike !== $location.search().spike ||
                    scope.fields.ingest_provider !== $location.search().ingest_provider) {
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

            scope.$on('search:parameters', searchParameters);

            function searchParameters() {
                $location.search('q', getQuery() || null);
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

        }
    };
}
