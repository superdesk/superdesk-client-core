// styles
import './styles/groups.scss';

import { GroupsSettingsController, GroupsConfigController } from './controllers';
import { GroupsFactory } from './services';
import * as directive from './directives';

/**
 * @ngdoc module
 * @module superdesk.apps.groups
 * @name superdesk.apps.groups
 * @packageName superdesk.apps
 * @description Superdesk module that allows user group functionalities.
 */
export default angular.module('superdesk.apps.groups', [
    'superdesk.apps.users'
])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
        .activity('/settings/groups', {
                label: gettext('Groups'),
                controller: GroupsSettingsController,
                templateUrl: 'scripts/apps/groups/views/settings.html',
                category: superdesk.MENU_SETTINGS,
                priority: -800,
                beta: true,
                privileges: {groups: 1}
            });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('groups', {
            type: 'http',
            backend: {
                rel: 'groups'
            }
        });
    }])
    .factory('groups', GroupsFactory)
    .directive('sdGroupeditBasic', directive.GroupeditBasicDirective)
    .directive('sdGroupeditPeople', directive.GroupeditPeopleDirective)
    .directive('sdGroupsConfig', () => ({controller: GroupsConfigController}))
    .directive('sdGroupsConfigModal', directive.GroupsConfigModal);
