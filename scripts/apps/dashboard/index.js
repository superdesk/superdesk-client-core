// styles
import './styles/dashboard.less';
import './styles/widgets.less';

// scripts
import './workspace-tasks/tasks';
import './world-clock/world-clock';
import './grid/grid';

import { DashboardController } from './controllers';
import * as directive from './directives';
import * as svc from './services';

angular.module('superdesk.apps.dashboard.widgets', [])
    .provider('dashboardWidgets', svc.DashboardWidgets);

angular.module('superdesk.widgets.base', ['superdesk.itemList'])
    .factory('BaseWidgetController', svc.BaseWidgetFactory);

angular.module('superdesk.apps.dashboard', [
    'superdesk.core.activity',
    'superdesk.apps.dashboard.widgets',
    'superdesk.apps.dashboard.grid',
    'superdesk.apps.dashboard.world-clock',
    'superdesk.workspace.tasks',
    'superdesk.itemList',
    'superdesk.legal_archive',
    'superdesk.workspace'
])
    .controller('DashboardController', DashboardController)
    .filter('wcodeFilter', () => (input, values) => _.pick(input, _.difference(_.keys(input), _.keys(values))))
    .config(['superdeskProvider', function(superdesk) {
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
            category: superdesk.MENU_MAIN
        });
    }]);

angular.module('superdesk.apps.dashboard').directive('sdWidget', directive.Widget);
