/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import './styles/aggregate.less';
import './styles/monitoring.less';

import './aggregate-widget/aggregate';

import * as ctrl from './controllers';
import * as config from './config';
import * as directive from './directives';
import { CardsService } from './services';
import { SplitFilter } from './filters';

angular.module('superdesk.apps.monitoring', ['superdesk.core.api', 'superdesk.aggregate', 'superdesk.search', 'superdesk.core.ui'])
    .controller('Monitoring', ctrl.MonitoringController)

    .service('cards', CardsService)

    .directive('sdMonitoringView', directive.MonitoringView)
    .directive('sdMonitoringGroup', directive.MonitoringGroup)
    .directive('sdMonitoringGroupHeader', directive.MonitoringGroupHeader)
    .directive('sdDeskNotifications', directive.DeskNotifications)
    .directive('sdItemActionsMenu', directive.ItemActionsMenu)

    .config(config.Monitoring)
    .config(config.SpikeMonitoring)
    .config(config.Personal)

    .filter('splitText', SplitFilter)

    .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
        keyboardManager.register('Monitoring', 'ctrl + g', gettext('Switches between single/grouped stage view'));
        keyboardManager.register('Monitoring', 'ctrl + alt + g', gettext('Switches between single/grouped desk view'));
    }]);

angular.module('superdesk.aggregate', ['superdesk.apps.authoring.widgets', 'superdesk.apps.desks', 'superdesk.workspace'])
    .controller('AggregateCtrl', ctrl.AggregateCtrl)
    .directive('sdAggregateSettings', directive.AggregateSettings)
    .directive('sdSortGroups', directive.SortGroups);
