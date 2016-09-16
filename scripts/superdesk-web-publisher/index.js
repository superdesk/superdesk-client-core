import { WebPublisherController } from './controllers';

export default angular.module('superdesk.web_publisher', ['superdesk.activity'])
    .config(['superdeskProvider', 'config', function(superdesk, config) {
        if (config.features && config.features.webPublisher) {
            superdesk
                .activity('/web_publisher/monitoring', {
                    label: gettext('Web Publisher'),
                    description: gettext('Web Publisher'),
                    priority: 100,
                    category: superdesk.MENU_MAIN,
                    adminTools: false,
                    controller: WebPublisherController,
                    templateUrl: 'scripts/superdesk-web-publisher/views/web-monitoring.html',
                    sideTemplateUrl: 'scripts/superdesk-web-publisher/views/web-publisher-sidenav-items.html'
                });
        }
    }]);
