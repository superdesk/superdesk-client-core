ActionPicker.$inject = ['desks', 'macros'];
export function ActionPicker(desks, macros) {
    return {
        scope: {
            desk: '=',
            stage: '=',
            macro: '='
        },
        templateUrl: 'scripts/superdesk-desks/views/actionpicker.html',
        link: function(scope, elem, attrs) {
            scope.desks = null;
            scope.deskStages = null;
            scope.deskMacros = null;

            scope.$watchGroup(['desk', 'stage'], function() {
                if (!scope.desks || !scope.deskStages) {
                    desks.initialize()
                    .then(function() {
                        scope.desks = desks.desks._items;
                        scope.deskStages = desks.deskStages;
                    });
                } else if (scope.desk) {
                    macros.getByDesk(desks.deskLookup[scope.desk].name, true).then(function(macros) {
                        scope.deskMacros = _.filter(macros, {action_type: 'direct'});
                    });

                    if (_.findIndex(scope.deskStages[scope.desk], {_id: scope.stage}) === -1) {
                        scope.stage = null;
                    }
                }
            });
        }
    };
}
