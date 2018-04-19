export default angular.module('superdesk.core.directives.sort', ['superdesk.core.services.asset'])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdSort
     *
     * @requires https://docs.angularjs.org/api/ng/service/$location $location
     * @requires asset
     *
     * @param {String} label User friendly text for sort field.
     * @param {String} field Field name for sort field.
     *
     * @description Inserts sort links based on current sort field and direction.
     */
    .directive('sdSort', ['$location', 'asset', function($location, asset) {
        return {
            scope: {
                label: '@',
                field: '@',
            },
            templateUrl: asset.templateUrl('core/views/sdSort.html'),
            link: function(scope, element, attrs) {
                scope.loc = $location;
                scope.sort = scope.loc.search().sort;

                scope.$watch('(loc.search()).sort', (val) => {
                    scope.sort = val;
                });

                element.click(() => {
                    scope.$apply(() => {
                        if (scope.sort && scope.field === scope.sort[0]) {
                            // switch sort direction
                            $location.search('sort', [scope.field, scope.sort[1] === 'asc' ? 'desc' : 'asc']);
                        } else {
                            // set sort field
                            $location.search('sort', [scope.field, 'asc']);
                        }
                    });
                });

                element.addClass('sortable');
            },
        };
    }]);
