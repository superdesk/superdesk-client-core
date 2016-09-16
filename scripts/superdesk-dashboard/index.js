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

angular.module('superdesk.dashboard.widgets', [])
    .provider('dashboardWidgets', svc.DashboardWidgets);

angular.module('superdesk.widgets.base', ['superdesk.itemList'])
    .factory('BaseWidgetController', svc.BaseWidgetFactory);

angular.module('superdesk.dashboard', [
    'superdesk.activity',
    'superdesk.dashboard.widgets',
    'superdesk.dashboard.grid',
    'superdesk.dashboard.world-clock',
    'superdesk.workspace.tasks',
    'superdesk.itemList',
    'superdesk.legal_archive',
    'superdesk.web_publisher',
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
            templateUrl: 'scripts/superdesk-dashboard/views/workspace.html',
            topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html',
            priority: -1000,
            adminTools: false,
            category: superdesk.MENU_MAIN
        });
    }]);

angular.module('superdesk.dashboard').directive('sdWidget', directive.Widget);
