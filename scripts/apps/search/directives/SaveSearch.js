import {mapPredefinedDateFiltersClientToServer} from './DateFilters';

SaveSearch.$inject = ['$location', 'asset', 'api', 'session', 'notify', 'gettext', '$rootScope'];

/**
 * Opens and manages save search panel
 */
export function SaveSearch($location, asset, api, session, notify, gettext, $rootScope) {
    return {
        templateUrl: asset.templateUrl('apps/search/views/save-search.html'),
        link: function(scope, elem) {
            scope.edit = null;
            scope.activateSearchPane = false;

            scope.$on('edit:search', (event, args) => {
                scope.activateSearchPane = false;
                scope.editingSearch = args;
                scope.edit = _.create(scope.editingSearch) || {};
            });

            scope.editItem = function() {
                scope.activateSearchPane = true;
                scope.edit = _.create(scope.editingSearch) || {};
            };

            scope.saveas = function() {
                scope.activateSearchPane = true;
                scope.edit = _.clone(scope.editingSearch) || {};
                delete scope.edit._id;
                scope.edit.name = '';
                scope.edit.description = '';
            };

            scope.cancel = function() {
                scope.sTab = scope.editingSearch ? 'savedSearches' : 'advancedSearch';
                scope.editingSearch = false;
                scope.edit = null;
                scope.activateSearchPane = false;
            };

            scope.clear = function() {
                scope.editingSearch = false;
                scope.edit = null;
                _.each($location.search(), (item, key) => {
                    if (key !== 'repo') {
                        $location.search(key, null);
                    }
                });
                $rootScope.$broadcast('tag:removed');
            };

            scope.search = function() {
                $rootScope.$broadcast('search:parameters');
            };

            /**
             * Patches or posts the given search
             */
            scope.save = function(editSearch) {
                function onSuccess() {
                    notify.success(gettext('Search was saved successfully'));
                    scope.cancel();
                    scope.sTab = 'savedSearches';
                    scope.edit = null;
                }

                function onFail(error) {
                    scope.edit = null;
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error. Search could not be saved.'));
                    }
                }

                var search = getFilters(_.clone($location.search()));

                editSearch.filter = {query: search};
                var originalSearch = {};

                if (editSearch._id) {
                    originalSearch = scope.editingSearch;
                }

                api('saved_searches')
                    .save(originalSearch, editSearch)
                    .then(onSuccess, onFail);
            };

            function getFilters(search) {
                let nextSearch = {...search};

                _.forOwn(nextSearch, (value, key) => {
                    if (_.includes(['priority', 'urgency'], key)) {
                        // Convert integer fields: priority and urgency to objects
                        nextSearch[key] = JSON.parse(value);
                    }
                });

                nextSearch = mapPredefinedDateFiltersClientToServer(nextSearch);

                return nextSearch;
            }
        },
    };
}
