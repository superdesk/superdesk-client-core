import { PARAMETERS } from 'superdesk-search/constants';

SearchTags.$inject = ['$location', '$route', 'tags', 'asset', 'metadata'];
export function SearchTags($location, $route, tags, asset, metadata) {
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
                var params = $location.search();
                if (params.q) {
                    var found = false;
                    angular.forEach(scope.cvs, function(cv) {
                        // If it is subject code, remove it from left bar, too
                        if (param.indexOf(cv.id + '.name:') !== -1) {
                            var elementName = param.substring(
                                param.indexOf('(') + 1,
                                param.lastIndexOf(')')
                            );

                            var codeList = scope.metadata[cv.list];
                            var qcode = _.result(_.find(codeList, function(item) {
                                                    return item.name === elementName;
                                                }), 'qcode');
                            if (qcode) {
                                found = true;
                                params.q = params.q.replace(cv.id + '.qcode:(' + qcode + ')', '').trim();
                                $location.search('q', params.q || null);

                                if (metadata.subjectScope != null) {
                                    metadata.removeSubjectTerm(elementName);
                                }
                            }
                        }
                    });

                    if (!found) {
                        params.q = params.q.replace(param, '').trim();
                        $location.search('q', params.q || null);
                    }
                }

                _.each(PARAMETERS, function(val, key) {
                    if (param.indexOf(val) !== -1) {
                        $location.search(key, null);
                    }
                });
            };
        }
    };
}
