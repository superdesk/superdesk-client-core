import _ from 'lodash';
import {IPackagesService} from 'types/Services/Packages';
import {GRID_VIEW, COMPACT_LIST_VIEW} from '../utils';

ContentResults.$inject = ['$location', 'preferencesService', 'packages', 'tags', 'asset', 'search'];

/*
 * TODO(x):
 * This directive is only temporarly,
 * it will be deleted with content and ingest
 */
export function ContentResults($location, preferencesService, packages: IPackagesService, tags, asset, search) {
    var update = {
        'archive:view': {
            allowed: [
                GRID_VIEW,
                COMPACT_LIST_VIEW,
            ],
            category: 'archive',
            view: GRID_VIEW,
            default: GRID_VIEW,
            label: 'Users archive view format',
            type: 'string',
        },
    };

    return {
        require: '^sdSearchContainer',
        templateUrl: asset.templateUrl('apps/search/views/search-results.html'),
        link: function(scope, elem, attr, controller) {
            const multiSelectable = attr.multiSelectable !== undefined;

            scope.flags = controller.flags;
            scope.selected = scope.selected || {};

            scope.preview = function preview(item) {
                if (multiSelectable) {
                    if (_.findIndex(scope.selectedList, {_id: item._id}) === -1) {
                        scope.selectedList.push(item);
                    } else {
                        _.remove(scope.selectedList, {_id: item._id});
                    }
                }
                scope.selected.preview = item;
                $location.search('_id', item ? item._id : null);
            };

            scope.openSingleItem = function(packageItem) {
                packages.fetchItem(packageItem).then((item) => {
                    scope.selected.view = item;
                });
            };

            scope.setview = setView;

            var savedView;

            preferencesService.get('archive:view').then((result) => {
                savedView = result.view;
                scope.view = !!savedView && savedView !== 'undefined' ? savedView : GRID_VIEW;
            });

            scope.$on('key:v', toggleView);

            function setView(view) {
                scope.view = view ?? GRID_VIEW;
                update['archive:view'].view = view ?? GRID_VIEW;
                preferencesService.update(update, 'archive:view');
            }

            function toggleView() {
                var nextView = scope.view === COMPACT_LIST_VIEW ? GRID_VIEW : COMPACT_LIST_VIEW;

                return setView(nextView);
            }

            /**
             * Generates Identifier to be used by track by expression.
             */
            scope.generateTrackByIdentifier = function(item) {
                return search.generateTrackByIdentifier(item);
            };
        },
    };
}
