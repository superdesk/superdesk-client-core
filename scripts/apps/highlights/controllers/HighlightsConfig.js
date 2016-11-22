HighlightsConfig.$inject = ['$scope', 'highlightsService', 'desks', 'api', 'gettext', 'notify', 'modal'];
export function HighlightsConfig($scope, highlightsService, desks, api, gettext, notify, modal) {

    highlightsService.get().then(function(items) {
        $scope.configurations = items;
    });

    $scope.configEdit = {};
    $scope.modalActive = false;

    var limits = {
        group: 45,
        highlight: 40
    };

    $scope.limits = limits;

    var _config;

    $scope.edit = function(config) {
        clearErrorMessages();
        $scope.modalActive = true;
        $scope.configEdit = _.create(config);
        $scope.assignedDesks = deskList(config.desks);
        _config = config;
        if (!$scope.configEdit.auto_insert) {
            $scope.configEdit.auto_insert = 'now/d'; // today
        }
    };

    $scope.cancel = function() {
        $scope.modalActive = false;
    };

    $scope.save = function() {
        var _new = !_config._id;
        $scope.configEdit.desks = assignedDesks();
        $scope.configEdit.groups = ['main'];

        highlightsService.saveConfig(_config, $scope.configEdit).then(function(item) {
            $scope.message = null;
            if (_new) {
                $scope.configurations._items.unshift(item);
            }
            $scope.modalActive = false;
        }, function(response) {
            errorMessage(response);
        });

        function errorMessage(response) {
            if (response.data && response.data._issues && response.data._issues.name
                && response.data._issues.name.unique) {
                $scope._errorUniqueness = true;
            } else {
                $scope.message = gettext('There was a problem while saving highlights configuration');
            }
        }

    };

    $scope.remove = function(config) {
        modal.confirm(gettext('Are you sure you want to delete configuration?'))
        .then(function() {
            highlightsService.removeConfig(config).then(function() {
                _.remove($scope.configurations._items, config);
                notify.success(gettext('Configuration deleted.'), 3000);
            });
        });
    };

    $scope.getHourVal = function(hour) {
        return 'now-' + hour + 'h';
    };

    function deskList(arr) {
        return _.map($scope.desks, function(d) {
            return {
                _id: d._id,
                name: d.name,
                included: isIncluded(arr, d._id)
            };
        });
    }

    function isIncluded(arr, id) {
        return _.findIndex(arr, function(c) {
            return c === id;
        }) > -1;
    }

    function assignedDesks() {
        return _.map(_.filter($scope.assignedDesks, {included: true}),
            function(desk) {
                return desk._id;
            });
    }

    $scope.handleEdit = function($event) {
        clearErrorMessages();
        if ($scope.configEdit.name != null) {
            $scope._errorLimits = $scope.configEdit.name.length > $scope.limits.highlight ? true : null;
        }
    };

    function clearErrorMessages() {
        if ($scope._errorUniqueness || $scope._errorLimits) {
            $scope._errorUniqueness = null;
            $scope._errorLimits = null;
        }
        $scope.message = null;
    }
}
