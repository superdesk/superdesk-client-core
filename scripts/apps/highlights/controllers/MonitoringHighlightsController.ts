import {dataApi} from 'core/helpers/CrudManager';
import {IHighlight} from 'types/Services/Highlight';

MonitoringHighlightsController.$inject = ['$scope', '$location'];
export function MonitoringHighlightsController($scope, $location) {
    const id = $location.search().highlight;

    dataApi.findOne<IHighlight>('highlights', id).then((highlight) => {
        $scope.selectedHighlightName = highlight.name;
        $scope.selectedHighlightId = id;
        $scope.$apply();
    });
}
