import { PARAMETERS } from 'superdesk-search/constants';

SearchTags.$inject = ['$location', 'tags', 'asset', 'metadata'];
export function SearchTags($location, tags, asset, metadata) {
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

                if (searchParameters.q && searchParameters.q.indexOf(param) >= 0) {
                    searchParameters.q = searchParameters.q.replace(param, '').trim();
                    $location.search('q', searchParameters.q || null);
                    return;
                }

                var parameterValue = '';

                if (param.indexOf('(') >= 0) {
                    parameterValue = param.substring(param.indexOf('(') + 1, param.lastIndexOf(')'));
                } else {
                    var type = param.split(':')[0];
                    _.each(PARAMETERS, function(value, key) {
                        if (type === value && searchParameters[key]) {
                            $location.search(key, null);
                            return;
                        }
                    });
                }

                angular.forEach(scope.cvs, function(cv) {
                    if (param.toLowerCase().indexOf(cv.field) !== -1) {
                        var codeList = scope.metadata[cv.list];
                        var qcode = _.result(_.find(codeList, function(code) {
                            return code.name === parameterValue || code.qcode === parameterValue;
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
}
