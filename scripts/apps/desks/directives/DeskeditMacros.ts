DeskeditMacros.$inject = ['macros', 'WizardHandler'];

/**
 * @ngdoc directive
 * @module superdesk.apps.desks
 * @name sdDeskeditMacros
 * @description
 *   Fetches and stores a list of macros for the current desk (if set,
 *   otherwise all macros), and defines the "previous" and "next"
 *   methods in the element's scope used by the Wizard handler.
 */
export function DeskeditMacros(macros, WizardHandler) {
    return {
        link: function(scope) {
            if (scope.desk && scope.desk.edit) {
                macros.getByDesk(scope.desk.edit.name, true).then((_macros) => {
                    scope.macros = _macros;
                });
            } else {
                macros.get().then((macroList) => {
                    scope.macros = macroList;
                });
            }

            scope.save = function() {
                WizardHandler.wizard('desks').finish();
            };
        },
    };
}
