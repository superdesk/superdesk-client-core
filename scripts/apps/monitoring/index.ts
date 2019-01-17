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
import {MonitoringController} from './controllers/MonitoringController';

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
    'superdesk.core.ui',
    'superdesk.apps.workspace.menu',
])
    .controller('Monitoring', MonitoringController)

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
        keyboardManager.register('Monitoring / List actions', 'ctrl + alt + j',
            gettext('Switch between grouped/single stage view'));
        keyboardManager.register('Monitoring / List actions', 'ctrl + alt + g',
            gettext('Switch between grouped/single desk view'));
        keyboardManager.register('Monitoring / List actions', 'page down',
            gettext('Move focus to next stage or group'));
        keyboardManager.register('Monitoring / List actions', 'page up',
            gettext('Move focus to previous stage or group'));
        keyboardManager.register('Monitoring / List actions', 'down/right Arrow',
            gettext('Select next item on focused stage or group'));
        keyboardManager.register('Monitoring / List actions', 'up/left Arrow',
            gettext('Select previous item on focused stage or group'));
        keyboardManager.register('Monitoring / List actions', 'alt + o', gettext('View an item'));
        keyboardManager.register('Monitoring / List actions', 'ctrl + alt + e', gettext('Edit an item'));
        keyboardManager.register('Monitoring / List actions', 'ctrl + alt + n',
            gettext('Edit an item in a new Window'));
        keyboardManager.register('Monitoring / List actions', 'ctrl + alt + d', gettext('Duplicate an item'));
        keyboardManager.register('Monitoring / List actions', 'ctrl + b', gettext('Create a broadcast'));
        keyboardManager.register('Monitoring / List actions', 'ctrl + shift + #', gettext('Spike item(s)'));
        keyboardManager.register('Monitoring / List actions', 'ctrl + alt + p', gettext('Create Package'));
        keyboardManager.register('Monitoring / List actions', 'ctrl + shift + ^', gettext('Mark for highlight'));
        keyboardManager.register('Monitoring / List actions', 'ctrl + shift + !', gettext('Mark for desk'));
    }]);

angular.module('superdesk.apps.aggregate', [
    'superdesk.apps.authoring.widgets',
    'superdesk.apps.desks',
    'superdesk.apps.workspace',
])
    .controller('AggregateCtrl', ctrl.AggregateCtrl)
    .directive('sdAggregateSettings', directive.AggregateSettings)
    .directive('sdSortGroups', directive.SortGroups)
    .directive('sdWidgetGroup', directive.WidgetGroup);
