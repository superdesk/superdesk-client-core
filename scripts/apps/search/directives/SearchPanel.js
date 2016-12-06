/**
 * @ngdoc directive
 * @module superdesk.apps.search
 * @name sdSearchPanel
 *
 * @requires $location
 * @requires desks
 * @requires privileges
 * @requires tags
 * @requires asset
 * @requires metadata
 * @requires $rootScope
 * @requires session
 *
 * @description
 *   A directive that generates the sidebar containing search results
 *   filters (so-called "aggregations" in Elastic's terms).
 */

SearchPanel.$inject = ['$location', 'desks', 'privileges', 'tags', 'asset', 'metadata', '$rootScope', 'session'];
export function SearchPanel($location, desks, privileges, tags, asset, metadata, $rootScope, session) {
    desks.initialize();
    return {
        require: '^sdSearchContainer',
        templateUrl: asset.templateUrl('apps/search/views/search-panel.html'),
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

            scope.$on('edit:search', (event, args) => {
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
                    $rootScope.$broadcast('aggregations:changed', {force: true});
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

            var initAggregations = function() {
                scope.aggregations = {
                    type: {},
                    desk: {},
                    date: {},
                    source: {},
                    credit: {},
                    category: {},
                    urgency: {},
                    priority: {},
                    genre: {},
                    legal: {},
                    sms: {}
                };
            };

            initAggregations();

            scope.$watch('items', () => {
                tags.initSelectedFacets().then((currentTags) => {
                    scope.tags = currentTags;

                    if (!scope.items || scope.items._aggregations === undefined) {
                        return;
                    }

                    initAggregations();

                    const collectType = () => {
                        if (angular.isDefined(scope.items._aggregations.type)) {
                            _.forEach(scope.items._aggregations.type.buckets, (type) => {
                                scope.aggregations.type[type.key] = type.doc_count;
                            });
                        }
                    };

                    const collectCategory = () => {
                        if (angular.isDefined(scope.items._aggregations.category)) {
                            _.forEach(scope.items._aggregations.category.buckets, (cat) => {
                                if (cat.key !== '') {
                                    scope.aggregations.category[cat.key] = cat.doc_count;
                                }
                            });
                        }
                    };

                    const collectGenre = () => {
                        if (angular.isDefined(scope.items._aggregations.genre)) {
                            _.forEach(scope.items._aggregations.genre.buckets, (g) => {
                                if (g.key !== '') {
                                    scope.aggregations.genre[g.key] = g.doc_count;
                                }
                            });
                        }
                    };

                    collectType();
                    collectCategory();
                    collectGenre();

                    if (angular.isDefined(scope.items._aggregations.urgency)) {
                        _.forEach(scope.items._aggregations.urgency.buckets, (urgency) => {
                            scope.aggregations.urgency[urgency.key] = urgency.doc_count;
                        });
                    }

                    if (angular.isDefined(scope.items._aggregations.priority)) {
                        _.forEach(scope.items._aggregations.priority.buckets, (priority) => {
                            scope.aggregations.priority[priority.key] = priority.doc_count;
                        });
                    }

                    if (angular.isDefined(scope.items._aggregations.source)) {
                        _.forEach(scope.items._aggregations.source.buckets, (source) => {
                            scope.aggregations.source[source.key] = source.doc_count;
                        });
                    }

                    if (angular.isDefined(scope.items._aggregations.credit)) {
                        _.forEach(scope.items._aggregations.credit.buckets, (credit) => {
                            scope.aggregations.credit[credit.key] = {count: credit.doc_count, qcode: credit.qcode};
                        });
                    }

                    if (angular.isDefined(scope.items._aggregations.desk)) {
                        _.forEach(scope.items._aggregations.desk.buckets, (desk) => {
                            var lookedUpDesk = desks.deskLookup[desk.key];

                            if (typeof lookedUpDesk === 'undefined') {
                                var msg = [
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
                        _.forEach(scope.items._aggregations.legal.buckets, (l) => {
                            if (l.key === 'T' && l.doc_count > 0) {
                                scope.aggregations.legal = {count: l.doc_count};
                            }
                        });
                    }

                    if (angular.isDefined(scope.items._aggregations.sms)) {
                        _.forEach(scope.items._aggregations.sms.buckets, (l) => {
                            if (l.key === 'T' && l.doc_count > 0) {
                                scope.aggregations.sms = {count: l.doc_count};
                            }
                        });
                    }
                });
            });

            scope.$watch('tags.currentSearch', (currentSearch) => {
                scope.showSaveSearch = !_.isEmpty(currentSearch);
            }, true);

            scope.toggleFilter = function(type, key) {
                if (scope.hasFilter(type, key)) {
                    scope.removeFilter(type, key);
                } else if (type === 'date') {
                    scope.setDateFilter(key);
                } else {
                    scope.setFilter(type, key);
                }
            };

            /**
             * Removes the facets from the list of facets by changing the url
             * It adds the parameters to the url as: notdesk=['123','456']&nottype=['type','composite']
             * Change in location triggers request to 'search' endpoint.
             * @param {String} type - facet type
             * @param {String} key - facet value
             * @param {object} evt - click event
             */
            scope.excludeFacet = function(type, key, evt) {
                if (scope.hasFilter(type, key)) {
                    // If the filter is selected then the filter is unselected and filter is removed.
                    scope.removeFilter(type, key);
                }

                setUrlParameter('not' + type, key);
                evt.stopPropagation();
            };

            scope.removeFilter = function(type, key) {
                tags.removeFacet(type, key);
            };

            /*
             * Filter the results further using the facets.
             * It changes the url based on the facet selected: desk=['123,'456']&type=['type','composite']
             * Change in location triggers request to 'search' endpoint.
             * @param {String} type - facet type
             * @param {String} key - facet value
             */
            scope.setFilter = function(type, key) {
                if (!scope.isEmpty(type) && key) {
                    setUrlParameter(type, key);
                } else {
                    $location.search(type, null);
                }
            };

            /*
             * Add parameter to the url.
             * @param {String} type - facet type
             * @param {String} key - facet value
             */
            function setUrlParameter(type, key) {
                var currentKeys = $location.search()[type];

                if (currentKeys) {
                    currentKeys = JSON.parse(currentKeys);
                    currentKeys.push(key);
                    $location.search(type, JSON.stringify(currentKeys));
                } else if (type === 'credit') {
                    $location.search('creditqcode',
                            JSON.stringify([scope.aggregations.credit[key].qcode]));
                } else {
                    $location.search(type, JSON.stringify([key]));
                }
            }

            /**
             * @ngdoc method
             * @name sdSearchPanel#set
             * @public
             * @description Set location url for date filters
             * @param {string} key Date key
             */
            scope.setDateFilter = function(key) {
                // Clean other date filters
                $location.search('afterfirstcreated', null);
                $location.search('beforefirstcreated', null);
                $location.search('afterversioncreated', null);
                $location.search('beforeversioncreated', null);

                switch (key) {
                case 'Last Day':
                    $location.search('after', 'now-24H');
                    break;
                case 'Last Week':
                    $location.search('after', 'now-1w');
                    break;
                case 'Last Month':
                    $location.search('after', 'now-1M');
                    break;
                case 'Scheduled Last Day':
                    $location.search('scheduled_after', 'now-24H');
                    break;
                case 'Scheduled Last 8Hrs':
                    $location.search('scheduled_after', 'now-8H');
                    break;

                default:
                    $location.search('after', null);
                    $location.search('scheduled_after', null);
                }
            };

            scope.isEmpty = function(type) {
                return _.isEmpty(scope.aggregations[type]);
            };

            scope.format = function(date) {
                return date ? moment(date).format('YYYY-MM-DD') : null; // jshint ignore:line
            };

            scope.hasFilter = function(type, key) {
                if (type === 'desk') {
                    return scope.tags.selectedFacets[type] &&
                        _.find(scope.tags.selectedFacets[type], (facet) => facet.value === key);
                }

                return scope.tags && scope.tags.selectedFacets[type] &&
                    scope.tags.selectedFacets[type].indexOf(key) >= 0;
            };

            /*
             * Checks if the user is Admin or Not.
             */
            scope.isAdmin = function() {
                return session.identity.user_type === 'administrator';
            };
        }
    };
}
