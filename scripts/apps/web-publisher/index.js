import './styles/web-publisher.scss';

import { WebPublisherManagerController } from './controllers';
import * as services from './services';

/**
 * @ngdoc module
 * @module superdesk.apps.web_publisher
 * @name superdesk.apps.web_publisher
 * @packageName superdesk.apps
 * @description Superdesk web publisher module.
 */
export default angular.module('superdesk.apps.web_publisher', [
    'superdesk.core.activity',
    'superdesk.config'
])

    .factory('publisher', services.PublisherFactory)
    .factory('pubapi', services.PubAPIFactory)

    .config(['superdeskProvider', 'config', function(superdesk, config) {
        superdesk
            .activity('/web_publisher/monitoring', {
                label: gettext('Web Publisher'),
                description: gettext('Web Publisher'),
                priority: 100,
                category: superdesk.MENU_MAIN,
                adminTools: false,
                templateUrl: 'scripts/apps/web-publisher/views/monitoring.html',
                sideTemplateUrl: 'scripts/apps/web-publisher/views/sidenav-items.html'
            })
            .activity('/web_publisher/manager', {
                label: gettext('Web Site Management'),
                description: gettext('Web Site Management'),
                controller: WebPublisherManagerController,
                controllerAs: 'webPublisher',
                templateUrl: 'scripts/apps/web-publisher/views/manager.html',
                sideTemplateUrl: 'scripts/apps/web-publisher/views/sidenav-items.html'
            });
    }]);
