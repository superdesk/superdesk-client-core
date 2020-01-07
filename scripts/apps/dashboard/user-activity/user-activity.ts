import {gettext} from 'core/utils';

angular.module('superdesk.apps.dashboard.user-activity', [
    'superdesk.apps.dashboard',
])
    .config(['dashboardWidgetsProvider', function(dashboardWidgets) {
        dashboardWidgets.addWidget('user-activity', {
            label: gettext('User Activity'),
            multiple: true,
            icon: '',
            max_sizex: 2,
            max_sizey: 2,
            sizex: 1,
            sizey: 2,
            classes: 'tabs modal--nested-fix',
            thumbnail: 'scripts/apps/dashboard/world-clock/thumbnail.svg',
            template: 'scripts/apps/dashboard/user-activity/user-activity.html',
            configurationTemplate: 'scripts/apps/dashboard/user-activity/user-activity-configuration.html',
            configuration: {},
            description: gettext('User activity widget'),
        });
    }]);
