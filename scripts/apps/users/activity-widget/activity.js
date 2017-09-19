angular.module('superdesk.apps.users.activity', [
    'superdesk.apps.users',
    'superdesk.apps.dashboard.widgets',
    'superdesk.core.services.asset'
])
    .config(['dashboardWidgetsProvider', 'assetProvider', function(dashboardWidgets, asset) {
        dashboardWidgets.addWidget('activity', {
            label: 'Activity Stream',
            multiple: true,
            max_sizex: 2,
            max_sizey: 2,
            sizex: 1,
            sizey: 2,
            thumbnail: asset.imageUrl('apps/users/activity-widget/thumbnail.svg'),
            template: asset.templateUrl('apps/users/activity-widget/widget-activity.html'),
            configurationTemplate: asset.templateUrl('apps/users/activity-widget/configuration.html'),
            configuration: {maxItems: 5},
            description: 'Activity stream widget',
            icon: 'stream'
        });
    }])
    .controller('ActivityController', ['$scope', 'profileService',
        function($scope, profileService) {
            var page = 1;
            var currentConfig = null;

            $scope.max_results = 0;

            function refresh(config) {
                currentConfig = config;
                profileService.getAllUsersActivity(config.maxItems).then((list) => {
                    $scope.activityFeed = list;
                    $scope.max_results = parseInt(config.maxItems, 10);
                });

                $scope.loadMore = function() {
                    page++;
                    profileService.getAllUsersActivity(config.maxItems, page).then((next) => {
                        Array.prototype.push.apply($scope.activityFeed._items, next._items);
                        $scope.activityFeed._links = next._links;
                        $scope.max_results += parseInt(config.maxItems, 10);
                    });
                };
            }

            $scope.$on('changes in activity', () => {
                if (currentConfig) {
                    refresh(currentConfig);
                }
            });

            $scope.$watch('widget.configuration', (config) => {
                page = 1;
                if (config) {
                    refresh(config);
                }
            }, true);
        }])
    .controller('ActivityConfigController', ['$scope',
        function($scope) {
            $scope.notIn = function(haystack) {
                return function(needle) {
                    return haystack.indexOf(needle) === -1;
                };
            };
        }]);
