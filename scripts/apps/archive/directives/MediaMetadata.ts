import _ from 'lodash';
import {appConfig} from 'appConfig';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {gettext} from 'core/utils';

MediaMetadata.$inject = ['userList', 'archiveService', 'metadata', '$timeout'];

export function MediaMetadata(userList, archiveService, metadata, $timeout) {
    return {
        scope: {
            item: '=',
        },
        templateUrl: 'scripts/apps/archive/views/metadata-view.html',
        link: function(scope, elem) {
            scope.$watch('item', reloadData);
            scope.isCorrectionWorkflowEnabled = appConfig?.corrections_workflow;
            scope.loading = true;

            getLabelNameResolver().then((_getLabelForFieldId) => {
                scope.$apply(() => {
                    scope.label = _getLabelForFieldId;
                    scope.loading = false;
                });
            });

            function reloadData() {
                var qcodes = [];

                metadata.getFilteredCustomVocabularies(qcodes).then((cvs) => {
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

            scope.getTermsTranslations = function(terms, scheme) {
                const filteredTerms = terms.filter((element) => element.scheme === scheme);

                return filteredTerms.map((term) => {
                    if (term.translations && scope.item.language
                        && term.translations.name[scope.item.language]) {
                        return term.translations.name[scope.item.language];
                    }
                    return term.name;
                });
            };
        },
    };
}
