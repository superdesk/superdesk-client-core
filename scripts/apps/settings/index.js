// styles
import './styles/settings.scss';

import * as directive from './directives';

/**
 * @ngdoc module
 * @module superdesk.apps.settings
 * @name superdesk.apps.settings
 * @packageName superdesk.apps
 * @description Superdesk application settings UI module.
 */
export default angular.module('superdesk.apps.settings', [])
    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('/settings', {
            label: gettext('Settings'),
            description: gettext('Do some admin chores'),
            controller: angular.noop,
            templateUrl: 'scripts/apps/settings/views/main.html',
            category: superdesk.MENU_MAIN,
            priority: 1000,
            adminTools: true,
            _settings: 1,
        });
    }])

    .directive('sdSettingsView', directive.SettingsView)
    .directive('sdDateParam', directive.DateParam)
    .directive('sdValidError', directive.ValidError)
    .directive('sdRoleUnique', directive.RoleUnique);
