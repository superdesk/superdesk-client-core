import _ from 'lodash';
import {gettext} from 'core/utils';

IngestDashboardController.$inject = ['$scope', 'api', 'ingestSources', 'preferencesService',
    'notify', 'config'];
export function IngestDashboardController($scope, $api, ingestSources, preferencesService, notify, config) {
    $scope.items = [];
    $scope.dashboard_items = [];

    $scope.fetchItems = function() {
        ingestSources.fetchDashboardProviders().then((result) => {
            $scope.items = result;
            $scope.dashboard_items = _.filter(result, {dashboard_enabled: true});
        });
    };

    $scope.setUserPreferences = function(refresh) {
        var preferences = [];
        var update = {};

        _.forEach(_.filter($scope.items, {dashboard_enabled: true}),
            (item) => {
                preferences.push(_.pick(item, _.union(['_id'], _.keys(config.ingest.PROVIDER_DASHBOARD_DEFAULTS))));
            }
        );

        update['dashboard:ingest'] = preferences;
        preferencesService.update(update).then((result) => {
            if (refresh) {
                $scope.fetchItems();
            }
        }, (error) => {
            notify.error(gettext('Ingest Dashboard preferences could not be saved.'), 2000);
        });
    };

    $scope.fetchItems();
}
