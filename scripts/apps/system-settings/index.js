/**
 * This file is part of Superdesk.
 *
 * Copyright 2017 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import * as ctrl from './controllers';
import * as directive from './directives';

angular.module('superdesk.apps.system-settings', [])
    .controller('SystemSettings', ctrl.SystemSettingsController)

    .directive('sdSystemSettings', directive.SystemSettingsDirective)
    .directive('sdTimeInterval', directive.TimeIntervalDirective)

    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('/settings/system-settings', {
            label: gettext('System Settings'),
            templateUrl: 'scripts/apps/system-settings/views/settings.html',
            category: superdesk.MENU_SETTINGS,
            priority: -800,
            privileges: {system_settings: 1}
        });
    }]);
