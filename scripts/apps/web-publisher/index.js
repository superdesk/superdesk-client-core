import 'ng-infinite-scroll';
import './styles/web-publisher.scss';

import 'angular-drag-and-drop-lists/angular-drag-and-drop-lists';
import {WebPublisherManagerController} from './controllers';
import {WebPublisherMonitoringController} from './controllers';
import * as services from './services';
import * as directive from './directives';

/**
 * @ngdoc module
 * @module superdesk.apps.web_publisher
 * @name superdesk.apps.web_publisher
 * @packageName superdesk.apps
 * @description Superdesk web publisher module.
 */
export default angular.module('superdesk.apps.web_publisher', [
    'superdesk.core.activity',
    'dndLists',
    'infinite-scroll'
])

    .directive('sdSiteRoutes', directive.SiteRoutesDirective)
    .directive('sdListArticles', directive.ListArticlesDirective)
    .directive('sdArticles', directive.ArticlesDirective)
    .directive('sdCardInputFocus', directive.CardInputFocusDirective)
    .factory('publisher', services.PublisherFactory)
    .factory('pubapi', services.PubAPIFactory)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/web_publisher/monitoring', {
                label: gettext('Web Publisher'),
                description: gettext('Web Publisher'),
                controller: WebPublisherMonitoringController,
                controllerAs: 'webPublisherMonitoring',
                templateUrl: 'scripts/apps/web-publisher/views/monitoring/index.html',
                sideTemplateUrl: 'scripts/apps/web-publisher/views/sidenav-items.html'
            })
            .activity('/web_publisher/manager', {
                label: gettext('Web Site Management'),
                description: gettext('Web Site Management'),
                priority: 100,
                category: superdesk.MENU_MAIN,
                adminTools: false,
                controller: WebPublisherManagerController,
                controllerAs: 'webPublisher',
                templateUrl: 'scripts/apps/web-publisher/views/manager.html',
                sideTemplateUrl: 'scripts/apps/web-publisher/views/sidenav-items.html'
            });
    }]);
