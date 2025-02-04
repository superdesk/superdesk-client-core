import _ from 'lodash';

HighlightsSettings.$inject = ['$scope', 'api', 'desks', '$q'];
export function HighlightsSettings($scope, api, desks, $q) {
    $scope.initialized = false;

    $q.all([
        api.query('content_templates', {where: {template_type: 'highlights'}}),
        desks.initialize(),
    ]).then(([result]) => {
        $scope.desks = desks.deskLookup;
        $scope.templates = result._items || [];
        $scope.hours = _.range(1, 25);
        $scope.auto = {day: 'now/d', week: 'now/w'};

        $scope.initialized = true;
    });
}
