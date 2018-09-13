import {cloneDeep} from 'lodash';

/**
 * @ngdoc directive
 * @module superdesk.apps.search
 * @name sdSearchPanel
 *
 * @requires $location
 * @requires desks
 * @requires privileges
 * @requires tags
 * @requires asset
 * @requires metadata
 * @requires $rootScope
 * @requires session
 *
 * @description
 *   A directive that generates the sidebar containing search results
 *   filters (so-called "aggregations" in Elastic's terms).
 */

SearchPanel.$inject = [
    '$location',
    'desks',
    'privileges',
    'tags',
    'asset',
    'metadata',
    '$rootScope',
    'session',
    'config',
];

export function SearchPanel($location,
    desks,
    privileges,
    tags,
    asset,
    metadata,
    $rootScope,
    session,
    config
) {
    desks.initialize();
    return {
        require: '^sdSearchContainer',
        templateUrl: asset.templateUrl('apps/search/views/search-panel.html'),
        scope: {
            items: '=',
            desk: '=',
            repo: '=',
            context: '=',
            toggleRepo: '=',
            providerType: '=',
        },
        link: function(scope, element, attrs, controller) {
            scope.config = config;
            scope.flags = controller.flags;
            scope.sTab = 'advancedSearch';
            scope.innerTab = 'parameters';
            scope.editingSearch = false;
            scope.showSaveSearch = false;
            scope.isManagingSubscriptions = false;
            scope.wrapper = {};

            scope.manageSubscriptions = (nextValue) => {
                scope.isManagingSubscriptions = nextValue;
            };

            scope.aggregations = {};
            scope.privileges = privileges.privileges;
            scope.userHasPrivileges = privileges.userHasPrivileges;
            scope.search_config = metadata.search_config;

            scope.$on('edit:search', (event, args) => {
                scope.sTab = 'advancedSearch';
                scope.innerTab = 'parameters';
                scope.activateSearchPane = false;
                scope.editingSearch = args;
                scope.wrapper.edit = cloneDeep(scope.editingSearch || {});
            });

            scope.changeTab = function(tabName) {
                scope.sTab = tabName;
            };

            scope.display = function(tabName) {
                scope.innerTab = tabName;
                if (tabName === 'filters') {
                    $rootScope.aggregations = 1;
                    $rootScope.$broadcast('aggregations:changed');
                } else {
                    $rootScope.aggregations = 0;
                }
            };

            scope.searching = function() {
                return !_.isEmpty($location.search());
            };

            scope.closeFacets = function() {
                scope.flags.facets = false;
                $rootScope.aggregations = 0;
            };

            scope.$watch('tags.currentSearch', (currentSearch) => {
                scope.showSaveSearch = !_.isEmpty(currentSearch);
            }, true);

            /*
             * Checks if the user is Admin or Not.
             */
            scope.isAdmin = function() {
                return session.identity.user_type === 'administrator';
            };
        },
    };
}
