/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import './styles/aggregate.scss';
import './styles/monitoring.scss';

import './aggregate-widget/aggregate';

import * as ctrl from './controllers';
import * as config from './config';
import * as directive from './directives';
import * as svc from './services';
import {SplitFilter} from './filters';

/**
 * @ngdoc module
 * @module superdesk.apps.monitoring
 * @name superdesk.apps.monitoring
 * @packageName superdesk.apps
 * @description Monitoring support for Superdesk content. Adds a new main tab
 * to the application.
 */
angular.module('superdesk.apps.monitoring', [
    'superdesk.core.api',
    'superdesk.apps.aggregate',
    'superdesk.apps.search',
    'superdesk.core.ui'
])
    .controller('Monitoring', ctrl.MonitoringController)

    .service('cards', svc.CardsService)

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
        keyboardManager.register('Monitoring', 'ctrl + d', gettext('Duplicates an item'));
        keyboardManager.register('Monitoring', 'ctrl + b', gettext('Creates a broadcast'));
        keyboardManager.register('Monitoring', 'ctrl + alt + t', gettext('Creates a new take'));
        keyboardManager.register('Monitoring', 'ctrl + shift + #', gettext('Spikes item(s)'));
    }]);

angular.module('superdesk.apps.aggregate', [
    'superdesk.apps.authoring.widgets',
    'superdesk.apps.desks',
    'superdesk.apps.workspace'
])
    .controller('AggregateCtrl', ctrl.AggregateCtrl)
    .directive('sdAggregateSettings', directive.AggregateSettings)
    .directive('sdSortGroups', directive.SortGroups);
