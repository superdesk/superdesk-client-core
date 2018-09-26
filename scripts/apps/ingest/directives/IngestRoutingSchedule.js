/**
 * @ngdoc directive
 * @module superdesk.apps.ingest
 * @name sdIngestRoutingSchedule
 * @description
 *   Creates the Schedule section (tab) of the routing rule edit form.
 */
IngestRoutingSchedule.$inject = ['tzdata'];
export function IngestRoutingSchedule(tzdata) {
    return {
        scope: {
            rule: '=', // the routing rule whose schedule is being edited
        },
        templateUrl: 'scripts/apps/ingest/views/settings/ingest-routing-schedule.html',
        link: function(scope) {
            scope.$watch('rule.schedule._allDay', (newVal) => {
                if (newVal) {
                    scope.rule.schedule.hour_of_day_from = null;
                    scope.rule.schedule.hour_of_day_to = null;
                } else {
                    if (!scope.rule.schedule.hour_of_day_from) {
                        scope.rule.schedule.hour_of_day_from = '00:00:00';
                    }

                    if (!scope.rule.schedule.hour_of_day_to) {
                        scope.rule.schedule.hour_of_day_to = '23:59:00';
                    }
                }
            });
        },
    };
}
