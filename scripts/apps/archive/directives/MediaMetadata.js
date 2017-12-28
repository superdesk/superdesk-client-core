MediaMetadata.$inject = ['userList', 'archiveService', 'metadata'];

export function MediaMetadata(userList, archiveService, metadata) {
    return {
        scope: {
            item: '='
        },
        templateUrl: 'scripts/apps/archive/views/metadata-view.html',
        link: function(scope, elem) {
            scope.$watch('item', reloadData);

            function reloadData() {
                var qcodes = [];
                var cvs = [];

                metadata.fetchMetadataValues().then(() => {
                    metadata.filterCvs(qcodes, cvs);
                    scope.cvs = _.sortBy(cvs, 'priority');
                    scope.genreInCvs = _.map(cvs, 'schema_field').indexOf('genre') !== -1;
                    scope.placeInCvs = _.map(cvs, 'schema_field').indexOf('place') !== -1;
                });

                scope.originalCreator = scope.item.original_creator;
                scope.versionCreator = scope.item.version_creator;

                if (!archiveService.isLegal(scope.item)) {
                    if (scope.item.original_creator) {
                        userList.getUser(scope.item.original_creator)
                            .then((user) => {
                                scope.originalCreator = user.display_name;
                            });
                    }
                    if (scope.item.version_creator) {
                        userList.getUser(scope.item.version_creator)
                            .then((user) => {
                                scope.versionCreator = user.display_name;
                            });
                    }
                }
            }
        }
    };
}
