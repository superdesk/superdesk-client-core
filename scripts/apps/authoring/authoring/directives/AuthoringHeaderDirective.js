AuthoringHeaderDirective.$inject = ['api', 'authoringWidgets', '$rootScope', 'archiveService', 'metadata',
            'content', 'lodash', 'authoring', 'vocabularies', '$timeout', 'config'];
export function AuthoringHeaderDirective(api, authoringWidgets, $rootScope, archiveService, metadata, content,
    lodash, authoring, vocabularies, $timeout, config) {
    return {
        templateUrl: 'scripts/apps/authoring/views/authoring-header.html',
        require: '?^sdAuthoringWidgets',
        link: function (scope, elem, attrs, WidgetsManagerCtrl) {
            scope.contentType = null;
            scope.displayCompanyCodes = null;

            scope.shouldDisplayUrgency = function() {
                return !(scope.editor.urgency || {}).service || (
                    Array.isArray(scope.item.anpa_category) &&
                    scope.item.anpa_category.length &&
                    scope.item.anpa_category[0].qcode &&
                    scope.editor.urgency.service[scope.item.anpa_category[0].qcode]
                );
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
                    financeCategory = _.find(scope.item.anpa_category, {'qcode': 'f'});
                    display = !_.isUndefined(financeCategory) && !_.isNull(financeCategory);
                }

                if (!display && scope.item.subject) {
                    financeCategory = _.find(scope.item.subject, function (category) {
                        if (category.qcode === '04000000' || category.qcode === '04006018' || category.qcode === '04019000') {
                            return category;
                        }
                    });
                    display = !_.isUndefined(financeCategory) && !_.isNull(financeCategory);
                }

                scope.displayCompanyCodes = display;
                return display;
            };

            scope.$watch('item', function (item) {
                if (!item) {
                    return;
                }

                scope.loaded = true;
                scope.missing_link = false;

                if (!archiveService.isLegal(scope.item)) {
                    var relatedItemWidget = _.filter(authoringWidgets, function (widget) {
                        return widget._id === 'related-item';
                    });

                    scope.activateWidget = function () {
                        WidgetsManagerCtrl.activate(relatedItemWidget[0]);
                    };

                    scope.previewMasterStory = function () {
                        var item_id = item.broadcast.takes_package_id ?
                            item.broadcast.takes_package_id : item.broadcast.master_id;
                        return api.find('archive', item_id).then(function(item) {
                            $rootScope.$broadcast('broadcast:preview', {'item': item});
                        });
                    };
                }
            });

            scope.$watch('item.profile', function (profile) {
                if (profile) {
                    content.getType(profile)
                        .then(function(type) {
                            scope.contentType = type;
                            scope.editor = authoring.editor = content.editor(type);
                            scope.schema = authoring.schema = content.schema(type);
                            initAnpaCategories();
                        });
                } else {
                    scope.editor = authoring.editor = content.editor();
                    scope.schema = authoring.schema = content.schema();
                }
            });

            function getRelatedItems() {
                // Related Items
                scope.missing_link = false;
                if (scope.item.slugline && scope.item.type === 'text') {
                    //get the midnight based on the defaultTimezone not the user timezone.
                    var fromDateTime = moment().tz(config.defaultTimezone).format(config.view.dateformat);
                    archiveService.getRelatedItems(scope.item.slugline, fromDateTime, scope.item._id)
                        .then(function(items) {
                            scope.relatedItems = items;
                            if (items && items._items.length) {
                                var takes_package = _.find(scope.item.linked_in_packages, function(linked_package) {
                                    return linked_package && linked_package.package_type === 'takes';
                                });
                                // if takes package is missing or not rewrite of.
                                scope.missing_link = !takes_package && !scope.item.rewrite_of &&
                                    !scope.item.rewritten_by;
                            }
                        });
                }
            }

            if (!archiveService.isLegal(scope.item)) {
                scope.$watch('item.slugline', function() {
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
                    _.forEach(scope.schema.subject.mandatory_in_list.scheme, function(subjectName) {
                        if (!_.startsWith(subjectName, 'subservice_')) {
                            return;
                        }
                        vocabularies.getVocabularies().then(function(vocabulariesColl) {
                            var vocabulary = _.find(vocabulariesColl._items, {'_id': subjectName});
                            if (vocabulary) {
                                var qcode = _.keys(vocabulary.service).pop();
                                var categoriesVocabulary = _.find(vocabulariesColl._items, {'_id': 'categories'});
                                var category = _.find(categoriesVocabulary.items, {'qcode': qcode});
                                if (category && _.findIndex(scope.item.anpa_category, {'name': category.name}) === -1) {
                                    if (!scope.item.anpa_category) {
                                        scope.item.anpa_category = [];
                                    }
                                    scope.item.anpa_category.splice(-1, 0,
                                        {'name': category.name, 'qcode': category.qcode, 'scheme': category.scheme});
                                }
                            }
                        });
                    });
                }
            }

            metadata.initialize().then(function() {
                scope.$watch('item.anpa_category', function(services) {
                    var qcodes = _.map(services, 'qcode');
                    var cvs = [];

                    metadata.filterCvs(qcodes, cvs);

                    scope.cvs = _.sortBy(cvs, 'priority');
                    scope.genreInCvs = _.map(cvs, 'schema_field').indexOf('genre') !== -1;
                    scope.placeInCvs = _.map(cvs, 'schema_field').indexOf('place') !== -1;

                    scope.shouldDisplayCompanyCodes();
                });

                scope.$watch('item.subject', function() {
                    scope.shouldDisplayCompanyCodes();
                });
            });

            // If correction set focus to the ednote to encourage user to fill it in
            _.defer (function() {
                if (scope.action === 'correct') {
                    elem.find('#ednote').focus();
                } else {
                    elem.find('#slugline').focus();
                }
            });
        }
    };
}
