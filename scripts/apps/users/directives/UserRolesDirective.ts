UserRolesDirective.$inject = ['api', 'gettext', 'notify', 'modal', '$filter', 'lodash', 'metadata'];
export function UserRolesDirective(api, gettext, notify, modal, $filter, _, metadata) {
    return {
        scope: true,
        templateUrl: 'scripts/apps/users/views/settings-roles.html',
        link: function(scope) {
            var _orig = null;

            scope.editRole = null;

            api('roles').query()
                .then((result) => {
                    scope.roles = $filter('sortByName')(result._items);
                });

            metadata.fetchMetadataValues().then(() => {
                scope.author_roles = metadata.values.author_roles;
            });

            scope.edit = function(role) {
                scope.editRole = _.create(role);
                _orig = role;
                scope.defaultRole = role.is_default;
            };

            scope.save = function(role) {
                var _new = !role._id;

                api('roles').save(_orig, role)
                    .then(() => {
                        if (_new) {
                            scope.roles.push(_orig);
                            notify.success(gettext('User role created.'));
                        } else {
                            notify.success(gettext('User role updated.'));
                        }
                        if (role.is_default) {
                            updatePreviousDefault(role);
                        }
                        scope.cancel();
                    }, (response) => {
                        if (response.status === 400 && typeof response.data._issues.name !== 'undefined' &&
                    response.data._issues.name.unique === 1) {
                            notify.error(gettext('I\'m sorry but a role with that name already exists.'));
                        } else if (typeof response.data._issues['validator exception'] !== 'undefined') {
                            notify.error(response.data._issues['validator exception']);
                        } else {
                            notify.error(gettext('I\'m sorry but there was an error when saving the role.'));
                        }
                    });
            };

            scope.cancel = function() {
                scope.editRole = null;
            };

            scope.remove = function(role) {
                confirm().then(() => {
                    api('roles').remove(role)
                        .then((result) => {
                            _.remove(scope.roles, role);
                        }, (response) => {
                            if (angular.isDefined(response.data._message)) {
                                notify.error(gettext('Error: ' + response.data._message));
                            } else {
                                notify.error(gettext('There was an error. Role cannot be deleted.'));
                            }
                        });
                });
            };

            function updatePreviousDefault(role) {
                // find previous role with flag 'default'
                var previous = _.find(scope.roles, (r) => r._id !== role._id && r.is_default);

                // update it
                if (previous) {
                    api('roles')
                        .getById(previous._id)
                        .then((result) => {
                            _.extend(previous, {_etag: result._etag, is_default: false});
                        });
                }
            }

            function confirm() {
                return modal.confirm(gettext('Are you sure you want to delete user role?'));
            }
        },
    };
}
