import _ from 'lodash';

IngestRoutingGeneral.$inject = ['weekdays', 'desks', 'macros'];
export function IngestRoutingGeneral(weekdays, desks, macros) {
    return {
        scope: {
            rule: '=',
        },
        templateUrl: 'scripts/apps/ingest/views/settings/ingest-routing-general.html',
        link: function(scope) {
            scope.dayLookup = weekdays;
            scope.macroLookup = {};

            desks.initialize()
                .then(() => {
                    scope.deskLookup = desks.deskLookup;
                    scope.stageLookup = desks.stageLookup;
                });

            macros.get().then((_macros) => {
                _.transform(_macros, (lookup, macro: any, idx) => {
                    scope.macroLookup[macro.name] = macro;
                });
            });
        },
    };
}
