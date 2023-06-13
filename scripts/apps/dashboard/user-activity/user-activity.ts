import {gettext} from 'core/utils';
import {reactToAngular1} from 'superdesk-ui-framework';
import UserActivityWidgetWithUser from './components/UserActivityWidgetWithUser';

angular
    .module('superdesk.apps.dashboard.user-activity', [
        'superdesk.apps.dashboard',
    ])
    .config([
        'dashboardWidgetsProvider',
        function(dashboardWidgets) {
            const descriptionHtml = `
<p>
    ${gettext(
        'The user activity widget provides information about user activity. ' +
        'Using the widget, editors can search and select a user. ' +
        'Upon selection a list of content items is shown categorized as follows:',
    )}
</p>
<ul class="simple-list sd-padding-start--2">
  <li class="simple-list__item">
    ${gettext('Items created by the user')}
  </li>
  <li class="simple-list__item">
    ${gettext('Items locked by the user')}
  </li>
  <li class="simple-list__item">
    ${gettext('Items marked for the user')}
  </li>
  <li class="simple-list__item">
    ${gettext('Items moved to a working stage by the user')}
  </li>
</ul>
`;

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
                descriptionHtml,
                removeHeader: true,
            });
        },
    ])
    .component(
        'sdUserActivityWidgetReact',
        reactToAngular1(UserActivityWidgetWithUser, []),
    );
