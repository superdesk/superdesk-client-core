import {gettext} from 'core/utils';
import {reactToAngular1} from 'superdesk-ui-framework';
import UserActivityWidget from './components/UserActivityWidget';

angular
    .module('superdesk.apps.dashboard.user-activity', [
        'superdesk.apps.dashboard',
    ])
    .config([
        'dashboardWidgetsProvider',
        function(dashboardWidgets) {
            dashboardWidgets.addWidget('user-activity', {
                label: gettext('User Activity'),
                multiple: true,
                icon: '',
                max_sizex: 2,
                max_sizey: 3,
                sizex: 1,
                sizey: 2,
                thumbnail: 'scripts/apps/dashboard/user-activity/thumbnail.svg',
                template:
                    'scripts/apps/dashboard/user-activity/user-activity.html',
                description: gettext('User activity widget'),
                removeHeader: true,
            });
        },
    ])
    .component(
        'sdUserActivityWidgetReact',
        reactToAngular1(UserActivityWidget, []),
    );
