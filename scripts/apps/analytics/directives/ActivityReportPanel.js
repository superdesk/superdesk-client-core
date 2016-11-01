ActivityReportPanel.$inject = [
    '$location', 'desks', 'asset', 'config', 'metadata', 'api', 'session', 'notify', '$rootScope'
];

/**
 * A directive that generates the sidebar containing activity report parameters
 */
export function ActivityReportPanel($location, desks, asset, config, metadata, api, session, notify, $rootScope) {
    return {
        templateUrl: asset.templateUrl('apps/analytics/views/activity-report-panel.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            // scope.flags = controller.flags;
            scope.panelTab = 'editingActivityReport';
            scope.innerTab = 'parameters';
            scope.showActivityReport = false;

            desks.initialize().then(function(){
                scope.desks = desks.desks._items;
                scope.initActivityReport();
            });

            metadata.initialize().then(function() {
                scope.metadata = metadata.values;
            });

            scope.$on('edit:activity_report', function(event, args)  {
                scope.panelTab = 'editingActivityReport';
                scope.innerTab = 'parameters';
                scope.activityReport = args;
                scope.group_by = {desk: args.hasOwnProperty('group_by') && args.group_by.indexOf('desk') >= 0};
            });

            scope.$watch('group_by.desk', function(group_by_desk) {
                if (scope.activityReport) {
                    if (group_by_desk === true) {
                        scope.activityReport.group_by = ['desk'];
                        delete scope.activityReport.desk;
                    } else if (scope.activityReport.hasOwnProperty('group_by')) {
                        delete scope.activityReport.group_by;
                    }
                }
            });

            /**
             * Initialises the activity report object
             *
             */
            scope.initActivityReport = function() {
                scope.activityReport = {operation: 'publish', desk: desks.activeDeskId};
                scope.group_by = {desk: false};
            };

            /**
             * Returns true if the report editing tab was selected
             *
             */
            scope.editReportSelected = function() {
                return scope.panelTab === 'editingActivityReport';
            };

            /**
             * Returns true if the saved reports tab was selected
             *
             */
            scope.savedReportsSelected = function() {
                return scope.panelTab !== 'editingActivityReport';
            };

            /**
             * Changes the tab to the given one
             * @param {String} tabName - valid values are 'editingActivityReport' and 'savedReports'
             *
             */
            scope.changeTab = function(tabName) {
                scope.panelTab = tabName;
            };

            /**
             * Changes the inner tab to the given one
             * @param {String} tabName - valid values are 'parameters' and 'grouping'
             *
             */
            scope.display = function(tabName) {
                scope.innerTab = tabName;
            };

            /**
             * Generate the report
             *
             */
            scope.generate = function() {
                function onSuccess(activityReport) {
                    $rootScope.$broadcast('view:activity_report', activityReport);
                    notify.success(gettext('The activity report was genereated successfully'));
                }

                function onFail(error) {
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error. The activity could not be generated.'));
                    }
                }

                var activityReportEdit = _.clone(scope.activityReport);
                activityReportEdit.operation_date = formatDate(scope.activityReport.operation_date);
                var toDelete = ['_id', '_etag', 'is_global', 'owner', 'name', 'description'];
                toDelete.forEach(function(field) {
                    delete activityReportEdit[field];
                });

                api('activity_reports', session.identity).save({}, activityReportEdit).then(onSuccess, onFail);
            };

            /**
             * Format given date for generate
             *
             */
            function formatDate(date) {
                return date ? moment(date, config.model.dateformat).format('YYYY-MM-DD') : null; // jshint ignore:line
            };
        }
    };
}
