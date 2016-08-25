ItemSearch.$inject = [
    '$location', '$timeout', 'asset', 'api', 'tags', 'search', 'metadata',
    'desks', 'userList', 'searchProviderService', '$filter', 'gettext',
];

export function ItemSearch(
    $location, $timeout, asset, api, tags, search, metadata, desks,
    userList, searchProviderService, $filter, gettext
) {
    return {
        scope: {
            repo: '=',
            context: '='
        },
        templateUrl: asset.templateUrl('superdesk-search/views/item-search.html'),
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
             * function to initialize default values on init or search provider change
             */
            scope.setDefaultValues = function() {
                if (scope.repo && scope.repo.search && scope.repo.search.indexOf('scanpix') === 0) {
                    scope.meta.scanpix_subscription = scope.scanpix_subscriptions[0].name;
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

                searchProviderService.getAllowedProviderTypes().then(function(providerTypes) {
                    scope.searchProviderTypes = providerTypes;
                });

                if (params.repo) {
                    var param_list = params.repo.split(',');
                    scope.repo.archive = param_list.indexOf('archive') >= 0;
                    scope.repo.ingest = param_list.indexOf('ingest') >= 0;
                    scope.repo.published = param_list.indexOf('published') >= 0;
                    scope.repo.archived = param_list.indexOf('archived') >= 0;
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

                if ($location.search().unique_name) {
                    scope.fields.unique_name = $location.search().unique_name;
                }

                if ($location.search().spike) {
                    scope.fields.spike = true;
                }

                if (load_data) {
                    fetchMetadata();
                    fetchProviders(params);
                    fetchUsers();
                    fetchDesks();
                } else {
                    initializeDesksDropDown();
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
                        angular.forEach(scope.cvs, function(cv) {
                            scope.selecteditems[cv.id] = search.getSelectedCodes(currentTags, scope.metadata[cv.list], cv.id);
                        });
                    });
            }

            scope.$on('$locationChangeSuccess', function() {
                if (scope.query !== $location.search().q ||
                    scope.fields.from_desk !== $location.search().from_desk ||
                    scope.fields.to_desk !== $location.search().to_desk ||
                    scope.fields.unique_name !== $location.search().unique_name ||
                    scope.fields.original_creator !== $location.search().original_creator ||
                    scope.fields.spike !== $location.search().spike) {
                    init();
                }
            });

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

            /**
             * Function which dictates whether the Go button should be enabled or disabled.
             *
             * @return {boolean} true if Go button in parameters section should be enabled. false otherwise.
             */
            scope.isSearchEnabled = function() {
                return scope.repo.search && (scope.repo.search !== 'local' ||
                    (scope.repo.ingest || scope.repo.archive || scope.repo.published || scope.repo.archived));
            };

            scope.isDefault = function(provider) {
                return scope.repo && scope.repo.search && provider.source && scope.repo.search === provider.source;
            };

            function updateParam() {
                scope.query = $location.search().q;
                $location.search('q', getQuery() || null);
                $location.search('repo', getActiveRepos());
                scope.meta = {};
            }

            scope.search = function() {
                updateParam();
            };

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
            scope.subjectSearch = function (item) {
                tags.initSelectedFacets().then(function (currentTags) {
                    angular.forEach(item, function(newSelectedCodes, field) {
                        var codeList = scope.metadata[scope.lookupCvs[field].list];
                        var selectedCodes = search.getSelectedCodes(currentTags, codeList, field);
                        if (newSelectedCodes.length > selectedCodes.length) {
                            /* Adding subject codes to filter */
                            var qcode = newSelectedCodes[newSelectedCodes.length - 1].qcode,
                                addItemSubjectName = field + '.qcode:(' + qcode + ')',
                                q = (scope.query ? scope.query + ' ' + addItemSubjectName : addItemSubjectName);
                            $location.search('q', q);
                        } else if (newSelectedCodes.length < selectedCodes.length) {
                            /* Removing subject codes from filter */
                            var params = $location.search();
                            if (params.q) {
                                for (var j = 0; j < selectedCodes.length; j++) {
                                    if (newSelectedCodes.indexOf(selectedCodes[j]) === -1) {
                                        var removeItemSubjectName = field + '.qcode:(' + selectedCodes[j].qcode + ')';
                                        params.q = params.q.replace(removeItemSubjectName, '').trim();
                                        $location.search('q', params.q || null);
                                        return;
                                    }
                                }
                            }
                        }
                    });
                });
            };

            scope.$on('$destroy', function() {
                inputField.off('keydown');
            });
        }
    };
}

