import _ from 'lodash';

HighlightsSettings.$inject = ['$scope', 'api', 'desks'];
export function HighlightsSettings($scope, api, desks) {
    desks.initialize().then(() => {
        $scope.desks = desks.deskLookup;
    });

    api.query('content_templates', {where: {template_type: 'highlights'}}).then((result) => {
        $scope.templates = result._items || [];
    });

    $scope.hours = _.range(1, 25);
    $scope.auto = {day: 'now/d', week: 'now/w'};
}
