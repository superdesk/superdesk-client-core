SystemSettingsController.$inject = ['$scope', 'api', '$rootScope'];
export function SystemSettingsController($scope, api, $rootScope) {
    const SETTINGS = {publish_queue_expire_interval: {default: {type: 'timedelta'}}},
        RESOURCE = 'system_settings';

    /**
     * Load system settings
     */
    $scope.load = () => {
        $scope.settings = {};
        $scope.local_settings = {};

        api.query(RESOURCE).then((result) => {
            $scope.settings = result._items;
            for (let setting of result._items) {
                $scope.settings[setting._id] = setting;
                if (_.has(SETTINGS, setting._id)) {
                    $scope.local_settings[setting._id] = setting.value;
                }
            }
        });
    };

    $scope.save = function() {
        _.forOwn($scope.local_settings, (value, key) => {
            var original = {}, updated = {};

            if (_.has($scope.settings, key)) {
                original = $scope.settings[key];
                updated = {value: value};
            } else {
                original = {};
                updated = _.has(SETTINGS[key], 'default') ? SETTINGS[key].default : {};
                updated._id = key;
                updated.value = value;
            }

            api.save(RESOURCE, original, updated).then((doc) => {
                $scope.settings[doc._id] = doc;
                $scope.local_settings[doc._id] = doc.value;
            });
        });
    };

    $scope.cancel = function() {
        $scope.load();
    };

    $scope.load();
}
