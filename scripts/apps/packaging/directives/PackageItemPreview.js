PackageItemPreview.$inject = ['api', 'lock', 'superdesk', 'authoringWorkspace', '$location', '$sce',
    'desks', 'vocabularies'];
export function PackageItemPreview(api, lock, superdesk, authoringWorkspace, $location, $sce,
    desks, vocabularies) {
    return {
        scope: {
            item: '=',
            readonly: '@'
        },
        templateUrl: 'scripts/apps/packaging/views/sd-package-item-preview.html',
        link: function(scope, elem) {
            scope.data = null;
            scope.error = null;
            scope.userLookup = desks.userLookup;
            scope.label = null;
            scope.labels = [];

            const packageItemLabelsVocabularyId = 'package-story-labels';

            var initLabels = () => {
                vocabularies.getVocabulary(packageItemLabelsVocabularyId).then((vocabulary) => {
                    scope.labels = vocabulary.items;
                    scope.label = _.find(vocabulary.items, {qcode: scope.item.label});
                });
            };

            initLabels();

            if (scope.item.location) {
                var url = '';
                var endpoint = '';

                if (_.includes(['archive', 'legal_archive'], scope.item.location)) {
                    url = scope.item.location + '/' + scope.item.residRef;
                    url += scope.item._current_version ? '?version=' + scope.item._current_version : '';
                    endpoint = scope.item.location;
                } else if (_.includes('ingest', scope.item.location)) {
                    url = scope.item.location + '/' + scope.item.residRef;
                    endpoint = 'ingest';
                } else {
                    url = scope.item.location + '/' + scope.item.residRef + ':' + scope.item._current_version;
                    endpoint = 'archived';
                }

                api[endpoint].getByUrl(url)
                    .then((result) => {
                        scope.data = result;
                        if (scope.data.abstract) {
                            scope.data.abstract = $sce.trustAsHtml(scope.data.abstract);
                        }
                        scope.isLocked = lock.isLocked(scope.data);
                        scope.isPublished = _.includes(['published', 'corrected'], scope.data.state);
                        scope.isKilled = scope.data.state === 'killed';
                    }, (response) => {
                        scope.error = true;
                    });
            }

            scope.$on('item:lock', (_e, data) => {
                if (scope.data && scope.data._id === data.item) {
                    scope.$applyAsync(() => {
                        scope.data.lock_user = data.user;
                        scope.isLocked = lock.isLocked(scope.data);
                    });
                }
            });

            scope.$on('item:unlock', (_e, data) => {
                if (scope.data && scope.data._id === data.item) {
                    scope.$applyAsync(() => {
                        scope.data.lock_user = null;
                        scope.isLocked = false;
                    });
                }
            });

            scope.$on('item:publish', (_e, data) => {
                if (scope.data && scope.data._id === data.item) {
                    scope.$applyAsync(() => {
                        scope.isPublished = true;
                    });
                }
            });

            scope.$on('item:label', (_e, data) => {
                if (scope.data && scope.data._id === data.item.residRef) {
                    scope.label = _.find(scope.labels, {qcode: data.item.label});
                }
            });

            scope.$on('vocabularies:updated', (_e, data) => {
                if (data.vocabulary_id === packageItemLabelsVocabularyId) {
                    initLabels();
                }
            });

            scope.preview = function(item) {
                superdesk.intent('preview', 'item', item);
            };

            scope.open = function(item) {
                authoringWorkspace.open(item);
            };
        }
    };
}
