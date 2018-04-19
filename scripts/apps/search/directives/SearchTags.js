import {PARAMETERS} from 'apps/search/constants';

/**
 * @ngdoc directive
 * @module superdesk.apps.search
 * @name sdSearchParameters
 *
 * @requires $location
 * @requires tags
 * @requires asset
 * @requires metadata
 * @requires desks
 * @requires $rootScope
 * @description
 *   A directive that parses location and generates tags.
 */
SearchTags.$inject = ['$location', 'tags', 'asset', 'metadata', 'desks', '$rootScope'];
export function SearchTags($location, tags, asset, metadata, desks, $rootScope) {
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

            const removeMarkedDeskParameter = (deskName) => {
                const deskId = desks.desks._items.find((d) => d.name === deskName)._id;

                tags.removeFacet('marked_desks', deskId);
            };

            scope.removeParameter = function(param) {
                var searchParameters = $location.search();

                if (searchParameters.q && searchParameters.q.indexOf(param) >= 0) {
                    let newQuery = _.uniq(searchParameters.q.replace(param, '').trim()
                        .split(/[\s,]+/));

                    searchParameters.q = newQuery.join(' ');
                    $location.search('q', searchParameters.q || null);
                    $rootScope.$broadcast('tag:removed');

                    return;
                }

                var parameterValue = '';

                if (param.indexOf('(') >= 0) {
                    parameterValue = param.substring(param.indexOf('(') + 1, param.lastIndexOf(')'));
                } else {
                    var type = param.split(':')[0];
                    var value = param.split(':')[1];

                    Object.keys(PARAMETERS).some((k) => {
                        if (PARAMETERS[k] === type && searchParameters[k]) {
                            if (k === 'marked_desks') {
                                removeMarkedDeskParameter(value);
                                return true;
                            }
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
        },
    };
}
