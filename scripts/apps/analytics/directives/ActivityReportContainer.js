export function ActivityReportContainer() {
    return {
        controller: ['$scope', '$location', 'gettext', 'pageTitle',
        function ActivityReportContainerController($scope, $location, gettext, pageTitle) {
            pageTitle.setUrl(gettext('Activity Report'));
        }]
    };
}
