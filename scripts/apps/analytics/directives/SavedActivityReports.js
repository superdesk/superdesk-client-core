SavedActivityReports.$inject = [
    '$rootScope', 'api', 'session', 'modal', 'notify', 'gettext', 'asset',
    '$location', 'desks', 'privileges', 'config', 'savedActivityReports'
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdSavedActivityReports
 * @requires $rootScope
 * @requires api
 * @requires session
 * @requires modal
 * @requires notify
 * @requires gettext
 * @requires asset
 * @requires $location
 * @requires desks,
 * @requires privileges
 * @requires config
 * @requires savedActivityReports
 * @description A directive that renders the activity reports lists
 */
export function SavedActivityReports($rootScope, api, session, modal, notify, gettext, asset,
    $location, desks, privileges, config, savedActivityReports) {
    return {
        templateUrl: asset.templateUrl('apps/analytics/views/saved-activity-reports.html'),
        scope: {},
        link: function(scope) {
            var resource = api('saved_activity_reports', session.identity);
            var originalUserActivityReports = [];
            var originalGlobalActivityReports = [];

            scope.searchText = null;
            scope.userSavedActivityReports = [];
            scope.globalSavedActivityReports = [];
            scope.privileges = privileges.privileges;

            desks.initialize().then(() => {
                scope.userLookup = desks.userLookup;
            });

            /**
             * @ngdoc method
             * @name sdSavedActivityReports#initSavedActivityReports
             * @description Initialises the saved activity reports directive
             */
            function initSavedActivityReports() {
                savedActivityReports.resetSavedActivityReports();
                savedActivityReports.getAllSavedActivityReports().then((activityReports) => {
                    scope.userSavedActivityReports = [];
                    scope.globalSavedActivityReports = [];
                    scope.activityReports = activityReports;
                    _.forEach(scope.activityReports, (savedActivityReport) => {
                        savedActivityReport.operation_date_start = formatDate(savedActivityReport.operation_date_start);
                        savedActivityReport.operation_date_end = formatDate(savedActivityReport.operation_date_end);
                        if (savedActivityReport.owner === session.identity._id) {
                            scope.userSavedActivityReports.push(savedActivityReport);
                        }
                        if (savedActivityReport.is_global) {
                            scope.globalSavedActivityReports.push(savedActivityReport);
                        }
                    });
                    originalUserActivityReports = _.clone(scope.userSavedActivityReports);
                    originalGlobalActivityReports = _.clone(scope.globalSavedActivityReports);
                });
            }

            initSavedActivityReports();

            /**
             * @ngdoc method
             * @name sdSavedActivityReports#edit
             * @param {Object} activityReport
             * @description Broadcasts the edit:activity_report event
             */
            scope.edit = function(activityReport) {
                $rootScope.$broadcast('edit:activity_report', activityReport);
            };

            /**
             * @ngdoc method
             * @name sdSavedActivityReports#filter
             * @description Filters the content of global and user activity reports lists
             */
            scope.filter = function() {
                scope.userSavedActivityReports = _.clone(originalUserActivityReports);
                scope.globalSavedActivityReports = _.clone(originalGlobalActivityReports);

                if (scope.searchText || scope.searchText !== '') {
                    scope.userSavedActivityReports = _.filter(originalUserActivityReports,
                        (n) => n.name.toUpperCase().indexOf(scope.searchText.toUpperCase()) >= 0);

                    scope.globalSavedActivityReports = _.filter(originalGlobalActivityReports,
                        (n) => n.name.toUpperCase().indexOf(scope.searchText.toUpperCase()) >= 0);
                }
            };

            /**
             * @ngdoc method
             * @name sdSavedActivityReports#remove
             * @param {Object} activityReport
             * @description Removed the given activity report
             */
            scope.remove = function(activityReport) {
                modal.confirm(
                    gettext('Are you sure you want to delete the activity report?')
                ).then(() => {
                    resource.remove(activityReport).then(() => {
                        notify.success(gettext('Activity report deleted'));
                        initSavedActivityReports();
                    }, () => {
                        notify.error(gettext('Error. Activity report not deleted.'));
                    });
                });
            };

            /**
             * @ngdoc method
             * @name sdSavedActivityReports#formatDate
             * @param {String} date
             * @returns {String}
             * @description Format given date for save
             */
            function formatDate(date) {
                return date ? moment(date).format(config.model.dateformat) : null; // jshint ignore:line
            }
        }
    };
}
