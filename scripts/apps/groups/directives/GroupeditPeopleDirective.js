GroupeditPeopleDirective.$inject = ['gettext', 'api', 'WizardHandler', 'groups'];
export function GroupeditPeopleDirective(gettext, api, WizardHandler, groups) {
    return {
        link: function(scope, elem, attrs) {

            scope.$watch('step.current', function(step, previous) {
                if (step === 'people') {
                    scope.search = null;
                    scope.groupMembers = [];
                    scope.users = [];
                    scope.message = null;

                    if (scope.group.edit && scope.group.edit._id) {
                        groups.initialize().then(function() {
                            scope.groupMembers = groups.groupMembers[scope.group.edit._id] || [];
                            scope.users = groups.users._items;
                        });
                    } else {
                        WizardHandler.wizard('usergroups').goTo(previous);
                    }
                }
            });

            scope.add = function(user) {
                scope.groupMembers.push(user);
            };

            scope.remove = function(user) {
                _.remove(scope.groupMembers, user);
            };

            scope.previous = function() {
                WizardHandler.wizard('usergroups').previous();
            };

            scope.save = function() {
                var members = _.map(scope.groupMembers, function(obj) {
                    return {user: obj._id};
                });

                api.groups.save(scope.group.edit, {members: members}).then(function(result) {
                    _.extend(scope.group.edit, result);
                    groups.groupMembers[scope.group.edit._id] = scope.groupMembers;
                    var orig = _.find(groups.groups._items, {_id: scope.group.edit._id});
                    _.extend(orig, scope.group.edit);
                    WizardHandler.wizard('usergroups').finish();
                }, function(response) {
                    scope.message = gettext('There was a problem, members not saved.');
                });
            };
        }
    };
}
