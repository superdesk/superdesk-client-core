/**
 * @memberof superdesk.apps.ingest
 * @ngdoc directive
 * @name sdIngestRoutingSchedule
 * @description
 *   Creates the Schedule section (tab) of the routing rule edit form.
 */
IngestRoutingSchedule.$inject = ['tzdata'];
export function IngestRoutingSchedule(tzdata) {
    return {
        scope: {
            rule: '='  // the routing rule whose schedule is being edited
        },
        templateUrl: 'scripts/apps/ingest/views/settings/ingest-routing-schedule.html',
        link: function (scope, element, attrs) {}
    };
}
