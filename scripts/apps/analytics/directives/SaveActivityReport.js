SaveActivityReport.$inject = ['$location', 'asset', 'api', 'session', 'notify', 'config', '$rootScope', 'lodash'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdSaveActivityReport
 * @requires $location
 * @requires asset
 * @requires api
 * @requires session
 * @requires notify
 * @requires config
 * @requires $rootScope, _
 * @description A directive that generates the activity report save dialog
 */
export function SaveActivityReport($location, asset, api, session, notify, config, $rootScope, _) {
    return {
        templateUrl: asset.templateUrl('apps/analytics/views/save-activity-report.html'),
        link: function(scope, element, attrs, controller) {
            /**
             * @ngdoc method
             * @name sdSaveActivityReport#save
             * @param {Object} activityReport
             * @description Patches or posts the given activity report
             */
            scope.save = function(activityReport) {
                function onSuccess() {
                    notify.success(gettext('The activity report was saved successfully'));
                    scope.clear();
                    scope.changeTab('savedReports');
                }

                function onFail(error) {
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error. The activity report could not be saved.'));
                    }
                }

                var originalActivityReport = {};
                var activityReportEdit = _.clone(activityReport);

                if (activityReportEdit._id) {
                    originalActivityReport = activityReportEdit;
                }
                activityReportEdit.owner = session.identity._id;
                activityReportEdit.operation_date_start = formatDate(activityReport.operation_date_start);
                activityReportEdit.operation_date_end = formatDate(activityReport.operation_date_end);
                $rootScope.$broadcast('savedactivityreport:update');

                api('saved_activity_reports', session.identity).save(originalActivityReport, activityReportEdit)
                    .then(onSuccess, onFail);
            };

            /**
             * @ngdoc method
             * @name sdSaveActivityReport#formatDate
             * @description Clears the activity report form
             */
            scope.clear = function() {
                scope.initActivityReport();
                $location.url($location.path());
            };

            /**
             * @ngdoc method
             * @name sdSaveActivityReport#formatDate
             * @param {String} date
             * @returns {String}
             * @description Format given date for save
             */
            function formatDate(date) {
                return date ? moment(date, config.model.dateformat).format('YYYY-MM-DD') : null; // jshint ignore:line
            }
        }
    };
}
