import {gettext} from 'core/ui/components/utils';

angular.module('superdesk.apps.dashboard.widgets.ingeststats', [])
    .factory('colorSchemes', ['$resource', function($resource) {
        return $resource('scripts/apps/ingest/static-resources/color-schemes.json');
    }])
    .config(['dashboardWidgetsProvider', function(dashboardWidgets) {
        dashboardWidgets.addWidget('ingest-stats', {
            label: gettext('Ingest Stats'),
            multiple: true,
            icon: 'signal',
            max_sizex: 1,
            max_sizey: 1,
            sizex: 1,
            sizey: 1,
            thumbnail: 'scripts/apps/ingest/ingest-stats-widget/thumbnail.svg',
            template: 'scripts/apps/ingest/ingest-stats-widget/widget-ingeststats.html',
            configurationTemplate: 'scripts/apps/ingest/ingest-stats-widget/configuration.html',
            configuration: {
                source: 'provider',
                colorScheme: 'superdesk',
                updateInterval: 5,
            },
            description: 'Displaying news ingest statistics. You can switch color themes or graph sources.',
        });
    }])
    .controller('IngestStatsController', ['$scope', '$timeout', 'api',
        function($scope, $timeout, api) {
            function updateData() {
                api.ingest.query().then((items) => {
                    $scope.items = items;

                    $timeout(() => {
                        updateData();
                    }, $scope.widget.configuration.updateInterval * 1000 * 60);
                });
            }

            updateData();
        }])
    .controller('IngestStatsConfigController', ['$scope', 'colorSchemes',
        function($scope, colorSchemes) {
            colorSchemes.get((colorsData) => {
                $scope.schemes = colorsData.schemes;
            });
        }]);
