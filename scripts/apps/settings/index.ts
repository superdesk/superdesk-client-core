// styles
import './styles/settings.scss';

import {reactToAngular1} from 'superdesk-ui-framework';
import {Settings} from './settings';
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

    .component('sdSettingsView', reactToAngular1(Settings))
    .directive('sdDateParam', directive.DateParam)
    .directive('sdValidError', directive.ValidError)
    .directive('sdRoleUnique', directive.RoleUnique);
