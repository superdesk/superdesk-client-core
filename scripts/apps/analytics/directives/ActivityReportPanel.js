ActivityReportPanel.$inject = [
    '$location', 'desks', 'asset', 'config', 'metadata', 'api', 'session', 'notify', '$rootScope'
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdActivityReportPanel
 * @requires $location
 * @requires desks
 * @requires asset
 * @requires config
 * @requires metadata
 * @requires api
 * @requires session
 * @requires notify
 * @requires $rootScope
 * @description A directive that generates the sidebar containing activity report parameters
 */
export function ActivityReportPanel($location, desks, asset, config, metadata, api, session, notify, $rootScope) {
    return {
        templateUrl: asset.templateUrl('apps/analytics/views/activity-report-panel.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            scope.panelTab = 'editingActivityReport';
            scope.innerTab = 'parameters';
            scope.showActivityReport = false;

            desks.initialize().then(() => {
                scope.desks = desks.desks._items;
                scope.initActivityReport();
            });

            metadata.initialize().then(() => {
                scope.metadata = metadata.values;
            });

            scope.$on('edit:activity_report', (event, args) => {
                scope.panelTab = 'editingActivityReport';
                scope.innerTab = 'parameters';
                scope.activityReport = args;
                scope.group_by = {desk: args.hasOwnProperty('group_by') && args.group_by.indexOf('desk') >= 0};
            });

            scope.$watch('group_by.desk', (groupByDesk) => {
                if (scope.activityReport) {
                    if (groupByDesk === true) {
                        scope.activityReport.group_by = ['desk'];
                        delete scope.activityReport.desk;
                    } else if (scope.activityReport.hasOwnProperty('group_by')) {
                        delete scope.activityReport.group_by;
                        scope.activityReport.desk = desks.activeDeskId;
                    }
                }
            });

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#initActivityReport
             * @description Initialises the activity report object
             */
            scope.initActivityReport = function() {
                scope.activityReport = {operation: 'publish', desk: desks.activeDeskId};
                scope.group_by = {desk: false};
            };

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#editReportSelected
             * @returns {Boolean}
             * @description Returns true if the report editing tab was selected
             */
            scope.editReportSelected = function() {
                return scope.panelTab === 'editingActivityReport';
            };

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#savedReportsSelected
             * @returns {Boolean}
             * @description Returns true if the saved reports tab was selected
             */
            scope.savedReportsSelected = function() {
                return scope.panelTab !== 'editingActivityReport';
            };

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#savedReportsSelected
             * @param {String} tabName - valid values are 'editingActivityReport' and 'savedReports'
             * @description Changes the tab to the given one
             */
            scope.changeTab = function(tabName) {
                scope.panelTab = tabName;
            };

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#savedReportsSelected
             * @param {String} tabName - valid values are 'parameters' and 'grouping'
             * @description Changes the inner tab to the given one
             */
            scope.display = function(tabName) {
                scope.innerTab = tabName;
            };

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#savedReportsSelected
             * @description Generate the report
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
                var toDelete = ['_id', '_etag', 'is_global', 'owner', 'name', 'description'];

                activityReportEdit.operation_date_start = formatDate(scope.activityReport.operation_date_start);
                activityReportEdit.operation_date_end = formatDate(scope.activityReport.operation_date_end);
                toDelete.forEach((field) => {
                    delete activityReportEdit[field];
                });

                api('activity_reports', session.identity).save({}, activityReportEdit)
                    .then(onSuccess, onFail);
            };

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#formatDate
             * @param {String} date
             * @description Format given date for generate
             */
            function formatDate(date) {
                return date ? moment(date, config.model.dateformat).format('YYYY-MM-DD') : null; // jshint ignore:line
            }
        }
    };
}
