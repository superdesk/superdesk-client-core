import {getLabelForStage} from 'apps/workspace/content/constants';

DeskSettingsController.$inject = ['$scope', 'desks'];
export function DeskSettingsController($scope, desks) {
    desks.initialize()
        .then(() => {
            $scope.desks = desks.desks;
            $scope.labelForStage = getLabelForStage;
        });
}
