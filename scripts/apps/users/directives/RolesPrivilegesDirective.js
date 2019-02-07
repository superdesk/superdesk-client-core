import handleError from '../helpers';
import {gettext} from 'core/utils';

RolesPrivilegesDirective.$inject = ['api', 'notify', '$q', '$filter'];
export function RolesPrivilegesDirective(api, notify, $q, $filter) {
    return {
        scope: true,
        templateUrl: 'scripts/apps/users/views/settings-privileges.html',
        link: function(scope) {
            api('roles')
                .query()
                .then((result) => {
                    scope.roles = $filter('sortByName')(result._items);
                });

            api('privileges').query()
                .then((result) => {
                    scope.privileges = result._items;
                });

            scope.saveAll = function(rolesForm) {
                var promises = [];

                _.each(scope.roles, (role) => {
                    promises.push(api.save('roles', role, _.pick(role, 'privileges'))
                        .then(null, (error) => {
                            console.error(error);
                        }));
                });

                $q.all(promises).then(() => {
                    notify.success(gettext('Privileges updated.'));
                    rolesForm.$setPristine();
                }, (response) => {
                    notify.error(gettext(handleError(response)));
                });
            };
        },
    };
}
