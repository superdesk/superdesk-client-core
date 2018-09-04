import './styles/search.scss';

import * as svc from './services';
import * as directive from './directives';
import {MultiActionBarController} from './controllers';
import {SearchController} from './controllers';
import SearchMenuController from './controllers/SearchMenuController';

angular.module('superdesk.apps.search.react', [
    'superdesk.apps.highlights',
    'superdesk.apps.translations',
    'superdesk.core.datetime',
    'superdesk.apps.authoring.metadata',
])
    .service('monitoringState', svc.MonitoringState)
    .directive('sdItemsList', directive.ItemList);

/**
 * @ngdoc module
 * @module superdesk.apps.search
 * @name superdesk.apps.search
 * @packageName superdesk.apps
 * @description Superdesk search module. Allows searching existing and ingested
 * content.
 */
angular.module('superdesk.apps.search', [
    'superdesk.core.api',
    'superdesk.apps.desks',
    'superdesk.apps.publish',
    'superdesk.core.activity',
    'superdesk.core.list',
    'superdesk.core.keyboard',
    'superdesk.apps.search.react',
    'superdesk.apps.workspace.menu',
])
    .value('searchCommon', {meta: {}})
    .service('search', svc.SearchService)
    .service('savedSearch', svc.SavedSearchService)
    .service('multiImageEdit', svc.MultiImageEditService)
    .service('tags', svc.TagService)
    .service('sort', svc.SortService)

    .controller('MultiActionBar', MultiActionBarController)
    .controller('SearchMenuController', SearchMenuController)

    .directive('sdSearchPanel', directive.SearchPanel)
    .directive('sdSearchTags', directive.SearchTags)
    .directive('sdSearchFilters', directive.SearchFilters)
    .directive('sdSearchResults', directive.SearchResults)
    .directive('sdSaveSearch', directive.SaveSearch)
    .directive('sdItemContainer', directive.ItemContainer)
    .directive('sdItemPreview', directive.ItemPreview)
    .directive('sdItemGlobalsearch', directive.ItemGlobalSearch)
    .directive('sdItemSearchbar', directive.ItemSearchbar)
    .directive('sdItemRepo', directive.ItemRepo)
    .directive('sdItemSortbar', directive.ItemSortbar)
    .directive('sdSavedSearchSelect', directive.SavedSearchSelect)
    .directive('sdSavedSearchSubscribe', directive.SavedSearchSubscribe)
    .directive('sdSavedSearchManageSubscribers', directive.SavedSearchManageSubscribers)
    .directive('sdSavedSearches', directive.SavedSearches)
    .directive('sdSearchContainer', directive.SearchContainer)
    .directive('sdSearchParameters', directive.SearchParameters)
    .directive('sdMultiActionBar', directive.MultiActionBar)
    .directive('sdRawSearch', directive.RawSearch)
    .directive('sdRepoDropdown', directive.RepoDropdown)

    .config(['superdeskProvider', 'assetProvider', 'workspaceMenuProvider',
        (superdesk, asset, workspaceMenuProvider) => {
            superdesk.activity('/search', {
                description: gettext('Find live and archived content'),
                priority: 200,
                label: gettext('Search'),
                templateUrl: asset.templateUrl('apps/search/views/search.html'),
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
                controller: SearchController,
                controllerAs: 'search',
            });

            workspaceMenuProvider.item({
                href: '/search',
                label: gettext('Search'),
                templateUrl: asset.templateUrl('apps/search/views/menu.html'),
                order: 900,
            });
        },
    ])

    .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
        keyboardManager.register('Search', 'ctrl + 0', gettext('Show search modal'));
        keyboardManager.register('Search', 'v', gettext('Toggle search view'));
    }]);
