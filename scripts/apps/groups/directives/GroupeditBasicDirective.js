GroupeditBasicDirective.$inject = ['gettext', 'api', 'WizardHandler'];
export function GroupeditBasicDirective(gettext, api, WizardHandler) {
    return {
        link: function(scope, elem, attrs) {

            var limits = {
                group: 40
            };

            scope.limits = limits;

            scope.$watch('step.current', function(step) {
                if (step === 'general') {
                    scope.edit(scope.group.edit);
                    scope.message = null;
                }
            });

            scope.edit = function(group) {
                scope.group.edit = _.create(group);
            };

            scope.save = function(group) {
                scope.message = gettext('Saving...');
                var _new = !!!group._id;
                api.groups.save(scope.group.edit, group).then(function() {
                    if (_new) {
                        scope.edit(scope.group.edit);
                        scope.groups._items.unshift(scope.group.edit);
                    } else {
                        var orig = _.find(scope.groups._items, {_id: scope.group.edit._id});
                        _.extend(orig, scope.group.edit);
                    }

                    WizardHandler.wizard('usergroups').next();
                }, errorMessage);
            };

            function errorMessage(response) {
                if (response.data && response.data._issues && response.data._issues.name
                    && response.data._issues.name.unique) {
                    scope._errorUniqueness = true;
                } else {
                    scope._error = true;
                }
                scope.message = null;
            }
            function clearErrorMessages() {
                if (scope._errorUniqueness || scope._error || scope._errorLimits) {
                    scope._errorUniqueness = null;
                    scope._error = null;
                    scope._errorLimits = null;
                }
            }
            scope.handleEdit = function($event) {
                clearErrorMessages();
                if (scope.group.edit.name != null) {
                    scope._errorLimits = scope.group.edit.name.length > scope.limits.group ? true : null;
                }
            };
        }
    };
}
