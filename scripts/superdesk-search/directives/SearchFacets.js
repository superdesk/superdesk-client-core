SearchFacets.$inject = ['$location', 'desks', 'privileges', 'tags', 'asset', 'metadata'];

/**
 * A directive that generates the sidebar containing search results
 * filters (so-called "aggregations" in Elastic's terms).
 */
export function SearchFacets($location, desks, privileges, tags, asset, metadata) {
    desks.initialize();
    return {
        require: '^sdSearchContainer',
        templateUrl: asset.templateUrl('superdesk-search/views/search-facets.html'),
        scope: {
            items: '=',
            desk: '=',
            repo: '=',
            context: '='
        },
        link: function(scope, element, attrs, controller) {
            scope.flags = controller.flags;
            scope.sTab = true;
            scope.editingSearch = false;
            scope.showSaveSearch = false;

            scope.aggregations = {};
            scope.privileges = privileges.privileges;
            scope.search_config = metadata.search_config;

            scope.$on('edit:search', function(event, args)  {
                scope.sTab = true;
            });

            scope.changeTab = function() {
                scope.sTab = !scope.sTab;
            };

            scope.resetEditingSearch = function() {
                scope.editingSearch = false;
                metadata.removeSubjectTerm(null);
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
}
