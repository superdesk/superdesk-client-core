ContentResults.$inject = ['$location', 'preferencesService', 'packages', 'tags', 'asset', 'search'];

/*
 * TODO(x):
 * This directive is only temporarly,
 * it will be deleted with content and ingest
 */
export function ContentResults($location, preferencesService, packages, tags, asset, search) {
    var update = {
        'archive:view': {
            allowed: [
                'mgrid',
                'compact',
            ],
            category: 'archive',
            view: 'mgrid',
            default: 'mgrid',
            label: 'Users archive view format',
            type: 'string',
        },
    };

    return {
        require: '^sdSearchContainer',
        templateUrl: asset.templateUrl('apps/search/views/search-results.html'),
        link: function(scope, elem, attr, controller) {
            var GRID_VIEW = 'mgrid',
                LIST_VIEW = 'compact';

            var multiSelectable = attr.multiSelectable !== undefined;

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
                scope.view = !!savedView && savedView !== 'undefined' ? savedView : 'mgrid';
            });

            scope.$on('key:v', toggleView);

            function setView(view) {
                scope.view = view || 'mgrid';
                update['archive:view'].view = view || 'mgrid';
                preferencesService.update(update, 'archive:view');
            }

            function toggleView() {
                var nextView = scope.view === LIST_VIEW ? GRID_VIEW : LIST_VIEW;

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
