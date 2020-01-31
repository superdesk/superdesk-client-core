import _ from 'lodash';

// styles
import './styles/dashboard.scss';
import './styles/widgets.scss';

// scripts
import './workspace-tasks/tasks';
import './world-clock/world-clock';
import './user-activity/user-activity';
import './grid/grid';
import './closed-desk';

import {DashboardController} from './controllers';
import * as directive from './directives';
import * as svc from './services';

import {gettext} from 'core/utils';

import {dashboardRoute} from 'appConfig';

angular.module('superdesk.apps.dashboard.widgets', [])
    .provider('dashboardWidgets', svc.DashboardWidgets);

angular.module('superdesk.apps.dashboard.widgets.base', ['superdesk.core.itemList'])
    .factory('BaseWidgetController', svc.BaseWidgetFactory);

/**
 * @ngdoc module
 * @module superdesk.apps.dashboard
 * @name superdesk.apps.dashboard
 * @packageName superdesk.apps
 * @description A module that includes the dashboard component.
 */
angular.module('superdesk.apps.dashboard', [
    'superdesk.core.activity',
    'superdesk.apps.dashboard.widgets',
    'superdesk.apps.dashboard.grid',
    'superdesk.apps.dashboard.world-clock',
    'superdesk.apps.dashboard.user-activity',
    'superdesk.apps.workspace.tasks',
    'superdesk.core.itemList',
    'superdesk.apps.legal_archive',
    'superdesk.apps.workspace',
    'superdesk.apps.dashboard.closed-desk',
])
    .controller('DashboardController', DashboardController)
    .filter('wcodeFilter', () => (input, values) => _.pick(input, _.difference(_.keys(input), _.keys(values))))
    .config(['superdeskProvider', 'workspaceMenuProvider', function(superdesk, workspaceMenuProvider) {
        superdesk.activity('/workspace', {
            label: gettext('Workspace'),
            description: gettext('Customize your widgets and views'),
            controller: 'DashboardController',
            controllerAs: 'dashboard',
            templateUrl: 'scripts/apps/dashboard/views/workspace.html',
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            priority: -1000,
            adminTools: false,
            category: superdesk.MENU_MAIN,
            privileges: {dashboard: 1},
        });

        workspaceMenuProvider.item({
            if: 'privileges.dashboard',
            icon: 'dashboard',
            href: dashboardRoute,
            label: gettext('Dashboard'),
            shortcut: 'ctrl+alt+b',
            order: 100,
        });
    }]);

angular.module('superdesk.apps.dashboard').directive('sdWidget', directive.Widget);
