IngestRoutingGeneral.$inject = ['weekdays', 'desks', 'macros'];
export function IngestRoutingGeneral(weekdays, desks, macros) {
    return {
        scope: {
            rule: '=',
            removeAction: '='
        },
        templateUrl: 'scripts/superdesk-ingest/views/settings/ingest-routing-general.html',
        link: function(scope) {
            scope.dayLookup = weekdays;
            scope.macroLookup = {};

            desks.initialize()
            .then(function() {
                scope.deskLookup = desks.deskLookup;
                scope.stageLookup = desks.stageLookup;
            });

            scope.remove = function() {
                if (typeof scope.removeAction === 'function') {
                    return scope.removeAction(scope.rule);
                }
            };

            macros.get().then(function(macros) {
                _.transform(macros, function(lookup, macro, idx) {
                    scope.macroLookup[macro.name] = macro;
                });
            });
        }
    };
}
