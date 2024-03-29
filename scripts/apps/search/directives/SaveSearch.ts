import {create, clone} from 'lodash';
import {saveOrUpdateSavedSearch} from '../SavedSearch';
import {gettext} from 'core/utils';
import {isEmptyString} from 'core/helpers/utils';
SaveSearch.$inject = ['$location', 'asset', 'api', 'notify', '$rootScope'];

/**
 * Opens and manages save search panel
 */
export function SaveSearch($location, asset, api, notify, $rootScope) {
    return {
        templateUrl: asset.templateUrl('apps/search/views/save-search.html'),
        link: function(scope, _elem) {
            scope.edit = null;
            scope.activateSearchPane = false;

            scope.$on('edit:search', (_event, args) => {
                scope.activateSearchPane = false;
                scope.editingSearch = args;
                scope.edit = create(scope.editingSearch) || {};
            });

            scope.editItem = function() {
                scope.activateSearchPane = true;
                scope.edit = create(scope.editingSearch) || {};
            };

            scope.saveas = function() {
                scope.activateSearchPane = true;
                scope.edit = clone(scope.editingSearch) || {};
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

            scope.isValid = function(edit) {
                if (edit.filter.query.raw == null) {
                    return isEmptyString(edit.name);
                }
                return edit.filter.query && isEmptyString(edit.filter.query.raw)
                    && isEmptyString(edit.name);
            };

            scope.clear = function() {
                scope.editingSearch = false;
                scope.edit = null;
                $location.search('');
                Object.keys(scope.repo).forEach((key) => {
                    if (key !== 'search') {
                        scope.repo[key] = true;
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

                // perform search with selected parameters before saving
                // so parameters get in the url where they are later read from
                scope.search();
                const rawSearchQuery = editSearch.filter && editSearch.filter.query
                    ? editSearch.filter.query.raw : null;

                editSearch.filter = {query: clone($location.search())};
                if (rawSearchQuery) {
                    editSearch.filter.query.raw = rawSearchQuery;
                }
                var originalSearch = editSearch._id ? scope.editingSearch : {};

                saveOrUpdateSavedSearch(api, originalSearch, editSearch)
                    .then(onSuccess, onFail);
            };
        },
    };
}
