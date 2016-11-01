ActivityReportView.$inject = ['$location', 'asset'];

/**
 * A directive that displays the generated activity report
 */
export function ActivityReportView($location, asset) {
    return {
        templateUrl: asset.templateUrl('apps/analytics/views/activity-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            scope.showActivityReport = false;
            scope.activityReport = null;
            scope.reportType = null;

            scope.$on('view:activity_report', function(event, args)  {
                scope.activityReport = args;
                initActivityReport();
            });

            /**
             * Initialises the activity report object
             *
             */
            function initActivityReport() {
                if (typeof scope.activityReport.group_by === 'array' && scope.activityReport.group_by.desk === true) {
                    scope.reportType = 'groupByDesk';
                } else {
                    scope.reportType = 'simple';
                }
            };
        }
    };
}
