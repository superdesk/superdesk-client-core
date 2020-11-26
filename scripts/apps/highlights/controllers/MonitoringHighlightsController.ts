import {dataApi} from 'core/helpers/CrudManager';
import {IHighlight} from 'types/Services/Highlight';

MonitoringHighlightsController.$inject = ['$scope', '$location'];
export function MonitoringHighlightsController($scope, $location) {
    dataApi.findOne<IHighlight>('highlights', $location.search().highlight).then((highlight) => {
        $scope.selectedHighlightName = highlight.name;
    });
}
