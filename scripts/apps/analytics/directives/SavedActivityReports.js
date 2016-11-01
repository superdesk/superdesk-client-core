SavedActivityReports.$inject = [
    '$rootScope', 'api', 'session', 'modal', 'notify', 'gettext', 'asset',
    '$location', 'desks', 'privileges', 'config', 'savedActivityReports',
];

export function SavedActivityReports($rootScope, api, session, modal, notify, gettext, asset,
        $location, desks, privileges, config, savedActivityReports) {
    return {
        templateUrl: asset.templateUrl('apps/analytics/views/saved-activity-reports.html'),
        scope: {},
        link: function(scope) {

            var resource = api('saved_activity_reports', session.identity);
            scope.searchText = null;
            scope.userSavedActivityReports = [];
            scope.globalSavedActivityReports = [];
            scope.privileges = privileges.privileges;
            var originalUserActivityReports = [];
            var originalGlobalActivityReports = [];

            desks.initialize().then(function() {
                scope.userLookup = desks.userLookup;
            });

            function initSavedActivityReports() {
                savedActivityReports.resetSavedActivityReports();
                savedActivityReports.getAllSavedActivityReports().then(function(activityReports) {
                    scope.userSavedActivityReports = [];
                    scope.globalSavedActivityReports = [];
                    scope.activityReports = activityReports;
                    _.forEach(scope.activityReports, function(savedActivityReport) {
                        savedActivityReport.operation_date = formatDate(savedActivityReport.operation_date);
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
             * Broadcasts the edit:activity_report event
             *
             */
            scope.edit = function(activityReport) {
                $rootScope.$broadcast('edit:activity_report', activityReport);
            };

            /**
             * Filters the content of global and user activity reports lists
             *
             */
            scope.filter = function() {
                scope.userSavedActivityReports = _.clone(originalUserActivityReports);
                scope.globalSavedActivityReports = _.clone(originalGlobalActivityReports);

                if (scope.searchText || scope.searchText !== '') {
                    scope.userSavedActivityReports = _.filter(originalUserActivityReports, function(n) {
                        return n.name.toUpperCase().indexOf(scope.searchText.toUpperCase()) >= 0;
                    });

                    scope.globalSavedActivityReports = _.filter(originalGlobalActivityReports, function(n) {
                        return n.name.toUpperCase().indexOf(scope.searchText.toUpperCase()) >= 0;
                    });
                }
            };

            /**
             * Removed the given activity report
             *
             */
            scope.remove = function(activityReport) {
                modal.confirm(
                    gettext('Are you sure you want to delete the activity report?')
                ).then(function() {
                    resource.remove(activityReport).then(function() {
                        notify.success(gettext('Activity report deleted'));
                        initSavedActivityReports();
                    }, function() {
                        notify.error(gettext('Error. Activity report not deleted.'));
                    });
                });
            };

            /**
             * Format given date for save
             *
             */
            function formatDate(date) {
                return date ? moment(date).format(config.model.dateformat) : null; // jshint ignore:line
            };
        }
    };
}
