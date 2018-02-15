/**
 * Action picker component
 *
 * Allows user to pick desk, stage and macro.
 * If required is specified it should be an object with {desk, stage, macro} set to true if required.
 */
ActionPicker.$inject = ['desks', 'macros'];
export function ActionPicker(desks, macros) {
    return {
        scope: {
            desk: '=',
            stage: '=',
            macro: '=',
            required: '='
        },
        template: require('../views/actionpicker.html'),
        link: function(scope, elem, attrs) {
            scope.desks = null;
            scope.deskStages = null;
            scope.deskMacros = null;

            function updateMacros() {
                macros.getByDesk(desks.deskLookup[scope.desk].name, true).then((macros) => {
                    scope.deskMacros = _.filter(macros, {action_type: 'direct'});
                });

                if (_.findIndex(scope.deskStages[scope.desk], {_id: scope.stage}) === -1) {
                    scope.stage = null;
                }
            }

            scope.$watchGroup(['desk', 'stage'], () => {
                if (!scope.desks || !scope.deskStages) {
                    desks.initialize()
                        .then(() => {
                            scope.desks = desks.desks._items;
                            scope.deskStages = desks.deskStages;
                            if (scope.desk) {
                                updateMacros();
                            }
                        });
                } else if (scope.desk) {
                    updateMacros();
                }
            });
        }
    };
}
