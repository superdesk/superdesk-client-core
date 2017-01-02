ActivityReportView.$inject = ['$location', 'asset'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdActivityReportView
 * @requires $location
 * @requires asset
 * @description A directive that displays the generated activity report
 */
export function ActivityReportView($location, asset) {
    return {
        templateUrl: asset.templateUrl('apps/analytics/views/activity-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            scope.showActivityReport = false;
            scope.activityReport = null;
            scope.reportType = null;

            scope.$on('view:activity_report', (event, args) => {
                scope.activityReport = args;
                initActivityReport();
            });

            /**
             * @ngdoc method
             * @name sdActivityReportView#initActivityReport
             * @description Initialises the activity report object
             */
            function initActivityReport() {
                if (scope.activityReport.group_by instanceof Array && scope.activityReport.group_by[0] === 'desk') {
                    scope.reportType = 'groupByDesk';
                } else {
                    scope.reportType = 'simple';
                }
            }
        }
    };
}
