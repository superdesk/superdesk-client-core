import * as constant from 'apps/ingest/constants';

IngestDashboardController.$inject = ['$scope', 'api', 'ingestSources', 'preferencesService', 'notify', 'gettext'];
export function IngestDashboardController($scope, $api, ingestSources, preferencesService, notify, gettext) {
    $scope.items = [];
    $scope.dashboard_items = [];

    $scope.fetchItems = function () {
        ingestSources.fetchDashboardProviders().then(function(result) {
            $scope.items = result;
            $scope.dashboard_items =  _.filter(result, {'dashboard_enabled': true});
        });
    };

    $scope.setUserPreferences = function(refresh) {
        var preferences = [];
        var update = {};

        _.forEach(_.filter($scope.items, {'dashboard_enabled': true}),
            function (item) {
                preferences.push(_.pick(item, _.union(['_id'], _.keys(constant.PROVIDER_DASHBOARD_DEFAULTS))));
            }
        );

        update['dashboard:ingest'] = preferences;
        preferencesService.update(update).then(function(result) {
            if (refresh) {
                $scope.fetchItems();
            }
        }, function(error) {
            notify.error(gettext('Ingest Dashboard preferences could not be saved.'), 2000);
        });
    };

    $scope.fetchItems();
}
