import handleError from '../helpers';

RolesPrivilegesDirective.$inject = ['api', 'gettext', 'notify', '$q', '$filter'];
export function RolesPrivilegesDirective(api, gettext, notify, $q, $filter) {
    return {
        scope: true,
        templateUrl: 'scripts/apps/users/views/settings-privileges.html',
        link: function(scope) {
            api('roles')
                .query()
                .then(function(result) {
                    scope.roles = $filter('sortByName')(result._items);
                });

            api('privileges').query()
                .then(function(result) {
                    scope.privileges = result._items;
                });

            scope.saveAll = function(rolesForm) {
                var promises = [];

                _.each(scope.roles, function(role) {
                    promises.push(api.save('roles', role, _.pick(role, 'privileges'))
                    .then(null, function(error) {
                        console.error(error);
                    }));
                });

                $q.all(promises).then(function() {
                    notify.success(gettext('Privileges updated.'));
                    rolesForm.$setPristine();
                }, function(response) {
                    notify.error(gettext(handleError(response)));
                });
            };
        }
    };
}
