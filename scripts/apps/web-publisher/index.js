import './styles/web-publisher.scss';

<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
import {WebPublisherManagerController} from './controllers';
import * as services from './services';
import * as directive from './directives';
=======
import { WebPublisherManagerController } from './controllers';
import * as services from './services';
>>>>>>> Added web publisher module

/**
 * @ngdoc module
 * @module superdesk.apps.web_publisher
 * @name superdesk.apps.web_publisher
 * @packageName superdesk.apps
 * @description Superdesk web publisher module.
 */
export default angular.module('superdesk.apps.web_publisher', [
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
    'superdesk.core.activity'
])

    .directive('sdSiteRoutes', directive.SiteRoutesDirective)
    .directive('sdListArticles', directive.ListArticlesDirective)
    .directive('sdCardInputFocus', directive.CardInputFocusDirective)
    .factory('publisher', services.PublisherFactory)
    .factory('pubapi', services.PubAPIFactory)

    .config(['superdeskProvider', function(superdesk) {
=======
    'superdesk.core.activity',
    'superdesk.config'
])

    .factory('publisher', services.PublisherFactory)
    .factory('pubapi', services.PubAPIFactory)

    .config(['superdeskProvider', 'config', function(superdesk, config) {
>>>>>>> Added web publisher module
        superdesk
            .activity('/web_publisher/monitoring', {
                label: gettext('Web Publisher'),
                description: gettext('Web Publisher'),
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
=======
                priority: 100,
                category: superdesk.MENU_MAIN,
                adminTools: false,
>>>>>>> Added web publisher module
                templateUrl: 'scripts/apps/web-publisher/views/monitoring.html',
                sideTemplateUrl: 'scripts/apps/web-publisher/views/sidenav-items.html'
            })
            .activity('/web_publisher/manager', {
                label: gettext('Web Site Management'),
                description: gettext('Web Site Management'),
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
                priority: 100,
                category: superdesk.MENU_MAIN,
                adminTools: false,
=======
>>>>>>> Added web publisher module
                controller: WebPublisherManagerController,
                controllerAs: 'webPublisher',
                templateUrl: 'scripts/apps/web-publisher/views/manager.html',
                sideTemplateUrl: 'scripts/apps/web-publisher/views/sidenav-items.html'
            });
    }]);
