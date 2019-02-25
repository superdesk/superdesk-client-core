import {ContentAPIController} from './controllers';
import * as directives from './directives';
import * as services from './services';
import {gettext} from 'core/utils';

/**
 * @ngdoc module
 * @module superdesk.apps.content_api
 * @name superdesk.apps.content_api
 * @packageName superdesk.apps
 * @description Superdesk Content API Application.
 */
angular.module('superdesk.apps.content-api', [
    'superdesk.core.api',
    'superdesk.apps.publish',
    'superdesk.apps.search',
])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/content_api', {
                label: gettext('Content API Search'),
                description: gettext('Search items is content API'),
                priority: 100,
                category: superdesk.MENU_MAIN,
                adminTools: false,
                controller: ContentAPIController,
                templateUrl: 'scripts/apps/content-api/views/list.html',
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
                filters: [],
                reloadOnSearch: false,
                privileges: {search_capi: 1},
            });
    }])

    .service('contentApiSearch', services.ContentAPISearchService)
    .directive('sdContentApiSearchPanel', directives.ContentAPISearchPanelDirective)
    .directive('sdContentApiSearchResults', directives.ContentAPISearchResultsDirective)
    .directive('sdContentApiSortBar', directives.ContentAPISortBarDirective)

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('search_capi', {
            type: 'http',
            backend: {
                rel: 'search_capi',
            },
        });
    }]);
