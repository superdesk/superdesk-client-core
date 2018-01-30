/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import './styles/publish.scss';

import * as svc from './services';
import * as ctrl from './controllers';
import * as directive from './directives';
import * as filter from './filters';

/**
 * @ngdoc module
 * @module superdesk.apps.publish
 * @name superdesk.apps.publish
 * @packageName superdesk.apps
 * @description Superdesk publishing support.
 */
export default angular.module('superdesk.apps.publish', ['superdesk.apps.users', 'superdesk.apps.content_filters'])

    .service('adminPublishSettingsService', svc.AdminPublishSettingsService)
    .service('subscribersService', svc.SubscribersService)

    .directive('sdAdminPubSubscribers', directive.SubscribersDirective)
    .directive('sdDestination', directive.DestinationDirective)

    .filter('subscribersBy', filter.SubscribersFilter)
    .controller('publishQueueCtrl', ctrl.PublishQueueController)
    .controller('SubscriberTokenCtrl', ctrl.SubscriberTokenController)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/settings/publish', {
                label: gettext('Subscribers'),
                templateUrl: 'scripts/apps/publish/views/settings.html',
                controller: ctrl.AdminPublishSettingsController,
                category: superdesk.MENU_SETTINGS,
                privileges: {subscribers: 1},
                priority: 2000
            })

            .activity('/publish_queue', {
                label: gettext('Publish Queue'),
                templateUrl: 'scripts/apps/publish/views/publish-queue.html',
                controller: ctrl.PublishQueueController,
                category: superdesk.MENU_MAIN,
                adminTools: false,
                privileges: {publish_queue: 1}
            });
    }])

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('subscribers', {
            type: 'http',
            backend: {rel: 'subscribers'}
        });
        apiProvider.api('publish_queue', {
            type: 'http',
            backend: {rel: 'publish_queue'}
        });
        apiProvider.api('consistency', {
            type: 'http',
            backend: {rel: 'consistency'}
        });
        apiProvider.api('legal_publish_queue', {
            type: 'http',
            backend: {rel: 'legal_publish_queue'}
        });
        apiProvider.api('io_errors', {
            type: 'http',
            backend: {rel: 'io_errors'}
        });
    }]);
