import {isNull, isUndefined, find, filter, keys, findIndex, defer, sortBy, map, forEach, startsWith} from 'lodash';

AuthoringHeaderDirective.$inject = [
    'api',
    'authoringWidgets',
    '$rootScope',
    'archiveService',
    'metadata',
    'content',
    'authoring',
    'vocabularies',
    '$timeout',
    'config',
    'moment',
    'features',
    'TranslationService',
    'authoringWorkspace',
];
export function AuthoringHeaderDirective(
    api,
    authoringWidgets,
    $rootScope,
    archiveService,
    metadata,
    content,
    authoring,
    vocabularies,
    $timeout,
    config,
    moment,
    features,
    TranslationService,
    authoringWorkspace,
) {
    return {
        templateUrl: 'scripts/apps/authoring/views/authoring-header.html',
        require: '?^sdAuthoringWidgets',
        link: function(scope, elem, attrs, WidgetsManagerCtrl) {
            scope.contentType = null;
            scope.displayCompanyCodes = null;
            scope.features = features;
            scope.translationService = TranslationService;

            scope.isCollapsed = authoringWorkspace.displayAuthoringHeaderCollapedByDefault == null
                ? false :
                authoringWorkspace.displayAuthoringHeaderCollapedByDefault;

            scope.toggleCollapsed = () => {
                scope.isCollapsed = !scope.isCollapsed;
            };

            if (TranslationService.translationsEnabled() === true) {
                TranslationService.getTranslations(scope.item)
                    .then((translations) => {
                        scope.translationsInfo = {
                            count: translations._meta.total,
                            translatedFromReference: translations._items.find(
                                (item) => item._id === scope.item.translated_from,
                            ),
                        };
                    })
                    .catch(() => {
                        // no translations found, do nothing
                    });
            }

            scope.shouldDisplayUrgency = function() {
                return !(scope.editor.urgency || {}).service ||
                    Array.isArray(scope.item.anpa_category) &&
                    scope.item.anpa_category.length &&
                    scope.item.anpa_category[0].qcode &&
                    scope.editor.urgency.service[scope.item.anpa_category[0].qcode]
                ;
            };

            /**
             * Returns true if the Company Codes field should be displayed, false otherwise.
             * Company Codes field is displayed only if either Subject or Category has finance category.
             */
            scope.shouldDisplayCompanyCodes = function() {
                if (!metadata.values.company_codes) {
                    return false;
                }

                var display = scope.item.company_codes && scope.item.company_codes.length > 0;
                var financeCategory;

                if (!display && scope.item.anpa_category) {
                    financeCategory = find(scope.item.anpa_category, {qcode: 'f'});
                    display = !isUndefined(financeCategory) && !isNull(financeCategory);
                }

                if (!display && scope.item.subject) {
                    financeCategory = find(scope.item.subject, (category) => {
                        if (category.qcode === '04000000' || category.qcode === '04006018'
                            || category.qcode === '04019000') {
                            return category;
                        }
                    });
                    display = !isUndefined(financeCategory) && !isNull(financeCategory);
                }

                scope.displayCompanyCodes = display;
                return display;
            };

            scope.$watch('item', (item) => {
                if (!item) {
                    return;
                }

                scope.loaded = true;
                scope.missing_link = false;

                if (!archiveService.isLegal(scope.item)) {
                    var relatedItemWidget = filter(authoringWidgets, (widget) => widget._id === 'related-item');

                    scope.activateWidget = function() {
                        WidgetsManagerCtrl.activate(relatedItemWidget[0]);
                    };

                    scope.previewMasterStory = function() {
                        var itemId = item.broadcast.master_id;

                        return api.find('archive', itemId).then((_item) => {
                            $rootScope.$broadcast('broadcast:preview', {item: _item});
                        });
                    };
                }
            });

            scope.activateTranslationsWidget = function() {
                WidgetsManagerCtrl.activate(authoringWidgets.find((widget) => widget._id === 'translations'));
            };

            scope.$watch('item.profile', (profile) => {
                if (profile) {
                    content.getType(profile)
                        .then((type) => {
                            scope.contentType = type;
                            scope.editor = authoring.editor = content.editor(type, scope.item.type);
                            scope.schema = authoring.schema = content.schema(type, scope.item.type);
                            initAnpaCategories();
                        });
                } else {
                    scope.editor = authoring.editor = content.editor(null, scope.item.type);
                    scope.schema = authoring.schema = content.schema(null, scope.item.type);
                }
            });

            function getNoMissingLink() {
                return config.features && 'noMissingLink' in config.features
                    && config.features.noMissingLink;
            }

            function getRelatedItems() {
                // Related Items
                scope.missing_link = false;
                if (scope.item.slugline && scope.item.type === 'text') {
                    // get the midnight based on the defaultTimezone not the user timezone.
                    var fromDateTime = moment().tz(config.defaultTimezone)
                        .format(config.view.dateformat);

                    archiveService.getRelatedItems(scope.item, fromDateTime)
                        .then((items) => {
                            scope.relatedItems = items;
                            if (items && items._items.length && !getNoMissingLink()) {
                                // if takes package is missing or not rewrite of.
                                scope.missing_link = !scope.item.rewrite_of &&
                                    !scope.item.rewritten_by;
                            }
                        });
                }
            }

            if (!archiveService.isLegal(scope.item)) {
                scope.$watch('item.slugline', () => {
                    $timeout(getRelatedItems, 800);
                });
            }

            /**
             * Sets the anpa category corresponding to the required subservice: if a subservice
             * field (defined in vocabularies) was declared as required in a content profile
             * then make sure that the corresponding anpa category was added to the anpa_category
             * field in the newly created item. Without this value the anpa category field is not
             * displayed.
             */
            function initAnpaCategories() {
                if (scope.schema.subject && scope.schema.subject.mandatory_in_list) {
                    forEach(scope.schema.subject.mandatory_in_list.scheme, (subjectName) => {
                        if (!startsWith(subjectName, 'subservice_')) {
                            return;
                        }
                        vocabularies.getVocabularies().then((vocabulariesColl) => {
                            var vocabulary: any = find(vocabulariesColl, {_id: subjectName});

                            if (vocabulary) {
                                var qcode = keys(vocabulary.service).pop();
                                var categoriesVocabulary: any = find(vocabulariesColl, {_id: 'categories'});
                                var category: any = find(categoriesVocabulary.items, {qcode: qcode});

                                if (category && findIndex(scope.item.anpa_category, {name: category.name}) === -1) {
                                    if (!scope.item.anpa_category) {
                                        scope.item.anpa_category = [];
                                    }
                                    scope.item.anpa_category.splice(-1, 0,
                                        {name: category.name, qcode: category.qcode, scheme: category.scheme});
                                }
                            }
                        });
                    });
                }
            }

            metadata.initialize().then(() => {
                scope.helper_text = metadata.helper_text;
                scope.popup_width = metadata.popup_width;
                scope.single_value = metadata.single_value;

                scope.$watchGroup(['item.anpa_category', 'editor', 'schema'], ([services, editor, schema]) => {
                    if (editor == null || schema == null) {
                        return;
                    }

                    var qcodes = map(services, 'qcode');

                    metadata.getCustomVocabulariesForArticleHeader(qcodes, editor, schema).then((cvs) => {
                        scope.cvs = sortBy(cvs, 'priority');
                        scope.genreInCvs = map(cvs, 'schema_field').indexOf('genre') !== -1;
                        scope.placeInCvs = map(cvs, 'schema_field').indexOf('place') !== -1;

                        scope.shouldDisplayCompanyCodes();
                    });
                });

                scope.$watch('item.subject', () => {
                    scope.shouldDisplayCompanyCodes();
                });
            });

            // If correction set focus to the ednote to encourage user to fill it in
            defer(() => {
                if (scope.action === 'correct') {
                    elem.find('#ednote').focus();
                } else {
                    elem.find('#slugline').focus();
                }
            });
        },
    };
}
