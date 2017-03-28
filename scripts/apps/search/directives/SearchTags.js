import {PARAMETERS} from 'apps/search/constants';

SearchTags.$inject = ['$location', 'tags', 'asset', 'metadata'];
export function SearchTags($location, tags, asset, metadata) {
    return {
        scope: {},
        templateUrl: asset.templateUrl('apps/search/views/search-tags.html'),
        link: function(scope) {
            scope.cvs = metadata.search_cvs;

            scope.$watch(function getSearchParams() {
                return _.omit($location.search(), ['_id', 'item', 'action']);
            }, (newValue, oldValue) => {
                if (newValue !== oldValue) {
                    reloadTags();
                }
            }, true);

            function init() {
                metadata
                    .initialize()
                    .then(() => {
                        scope.metadata = metadata.values;
                    });

                reloadTags();
            }

            function reloadTags() {
                tags.initSelectedFacets().then((currentTags) => {
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

                    Object.keys(PARAMETERS).some((k) => {
                        if (PARAMETERS[k] === type && searchParameters[k]) {
                            $location.search(k, null);
                            return true;
                        }

                        return false;
                    });
                }

                angular.forEach(scope.cvs, (cv) => {
                    if (param.indexOf(cv.name) !== -1) {
                        var codeList = scope.metadata[cv.list];
                        var qcode = _.result(_.find(codeList,
                            (code) => code.name === parameterValue || code.qcode === parameterValue), 'qcode');

                        if (qcode) {
                            if (searchParameters[cv.id]) {
                                tags.removeFacet(cv.id, qcode);
                            } else {
                                searchParameters.q = searchParameters.q
                                    .replace(cv.id + '.qcode:(' + qcode + ')', '')
                                    .trim();

                                $location.search('q', searchParameters.q || null);
                            }
                        }
                    }
                });
            };
        }
    };
}
