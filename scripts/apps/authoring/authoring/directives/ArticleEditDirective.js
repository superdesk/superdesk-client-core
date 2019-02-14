import {FIELD_KEY_SEPARATOR} from 'core/editor3/helpers/fieldsMeta';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {MEDIA_TYPES} from 'apps/vocabularies/constants';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdArticleEdit
 *
 * @requires autosave
 * @requires authoring
 * @requires metadata
 * @requires $filter
 * @requires superdesk
 * @requires content
 * @requires config
 * @requires deployConfig
 * @requires session
 * @requires gettext
 * @requires history
 * @requires $interpolate
 * @requires suggest
 * @requires renditions
 *
 * @description
 *   This directive is responsible for generating handles editing of the main text fields of the item in authoring.
 *   It is also used in the Template Editor and for Archived Kill item.
 */

ArticleEditDirective.$inject = [
    'autosave',
    'authoring',
    'metadata',
    '$filter',
    'superdesk',
    'content',
    'config',
    'deployConfig',
    'session',
    'gettext',
    'history',
    '$interpolate',
    'suggest',
    'renditions',
];
export function ArticleEditDirective(
    autosave,
    authoring,
    metadata,
    $filter,
    superdesk,
    content,
    config,
    deployConfig,
    session,
    gettext,
    history,
    $interpolate,
    suggest,
    renditions
) {
    return {
        templateUrl: 'scripts/apps/authoring/views/article-edit.html',
        link: function(scope, elem) {
            getLabelNameResolver().then((getLabelForFieldId) => {
                scope.handleUrlsChange = function(fieldId, value) {
                    scope.item.extra[fieldId] = value;
                    scope.autosave(scope.item);
                };

                scope.toggleDetails = true;
                scope.errorMessage = null;
                scope.contentType = null;
                scope.canListEditSignOff = config.user && config.user.sign_off_mapping;
                scope.editSignOff = false;
                scope.mediaLoading = false;
                scope.validator = deployConfig.getSync('validator_media_metadata');
                scope.features = config.features;

                var mainEditScope = scope.$parent.$parent;
                var autopopulateByline = config.features && config.features.autopopulateByline;

                scope.label = (id) => getLabelForFieldId(id);

                scope.FIELD_KEY_SEPARATOR = FIELD_KEY_SEPARATOR;
                scope.mediaTypes = MEDIA_TYPES;

                /* Start: Dateline related properties */

                scope.monthNames = {Jan: '0', Feb: '1', Mar: '2', Apr: '3', May: '4', Jun: '5',
                    Jul: '6', Aug: '7', Sep: '8', Oct: '9', Nov: '10', Dec: '11'};

                scope.dateline = {
                    month: '',
                    day: '',
                };

                scope.preview = function(item) {
                    superdesk.intent('preview', 'item', item);
                };

                /* End: Dateline related properties */

                // watch item and save every change in history in order to perform undo/redo later
                // ONLY for editor2 (with blocks)
                try {
                    angular.module('superdesk.apps.editor2');
                    history.watch('item', mainEditScope || scope);
                } catch (e) {
                    // no-op
                }

                scope.$on('History.undone', triggerAutosave);
                scope.$on('History.redone', triggerAutosave);

                function triggerAutosave() {
                    if (mainEditScope) {
                        mainEditScope.$applyAsync(() => {
                            mainEditScope.autosave(mainEditScope.item);
                        });
                    }
                }

                scope.$watch('item', (item) => {
                    if (item) {
                        /* Creates a copy of dateline object from item.__proto__.dateline */
                        if (item.dateline) {
                            var updates = {dateline: {}};

                            updates.dateline = _.pick(item.dateline, ['source', 'date', 'located', 'text']);
                            if (item.dateline.located) {
                                var monthAndDay = $filter('parseDateline')(item.dateline.date, item.dateline.located);

                                scope.dateline.month = monthAndDay.month;
                                scope.dateline.day = monthAndDay.day;
                                scope.resetNumberOfDays(false);
                            }
                            _.extend(item, updates);
                        }
                        if (autopopulateByline && !item.byline) {
                            item.byline = session.identity.byline;
                        }
                    }
                });

                metadata.initialize().then(() => {
                    scope.metadata = metadata.values;

                    if (scope.item && !scope.item.sign_off) {
                        scope.modifySignOff(session.identity);
                    }
                });

                /**
                 * Invoked by the directive after updating the property in item. This method is responsible for updating
                 * the properties dependent on dateline.
                 */
                scope.updateDateline = function(item, city) {
                    if (city === '') {
                        item.dateline.date = null;
                        item.dateline.located = null;
                        item.dateline.text = '';

                        scope.dateline.month = '';
                        scope.dateline.day = '';
                    } else {
                        var monthAndDay = $filter('parseDateline')(item.dateline.date, item.dateline.located);

                        scope.dateline.month = monthAndDay.month;
                        scope.dateline.day = monthAndDay.day;
                        scope.resetNumberOfDays(false);
                        if (!item.dateline.date) {
                            item.dateline.date = $filter('relativeUTCTimestamp')(scope.item.dateline.located,
                                parseInt(scope.dateline.month, 10), parseInt(scope.dateline.day, 10));
                        }

                        item.dateline.text = $filter('formatDatelineText')(item.dateline.located,
                            $interpolate('{{ month | translate }}')({
                                month: _.findKey(scope.monthNames, (m) => m === scope.dateline.month),
                            }),
                            scope.dateline.day, item.source);
                    }
                };

                /**
                 * Invoked when user changes a month in the datelineMonth.
                 * Populates the datelineDay field with the days in the selected month.
                 *
                 * @param {Boolean} resetDatelineDate if true resets the dateline.date to be relative to selected date.
                 * @param {String} datelineMonth - the selected month
                 */
                scope.resetNumberOfDays = function(resetDatelineDate, datelineMonth) {
                    if (scope.dateline.month !== '') {
                        scope.daysInMonth = $filter('daysInAMonth')(parseInt(scope.dateline.month, 10));

                        if (resetDatelineDate) {
                            if (datelineMonth) {
                                scope.dateline.month = datelineMonth;
                            }

                            scope.modifyDatelineDate(scope.dateline.day);
                        }
                    } else {
                        scope.daysInMonth = [];
                        scope.dateline.day = '';
                    }
                };

                /**
                 * Return current signoff mapping
                 */
                scope.getSignOffMapping = function() {
                    if (config.user && config.user.sign_off_mapping) {
                        return config.user.sign_off_mapping;
                    }
                    return null;
                };

                /**
                 * Modify the sign-off with the value from sign_off_mapping field from user
                 */
                scope.modifySignOff = function(user) {
                    if (config.user && config.user.sign_off_mapping) {
                        scope.item.sign_off = user[config.user.sign_off_mapping];
                        autosave.save(scope.item, scope.origItem);
                    }
                };

                /**
                 * Update the sign-off with current search value
                 */
                scope.searchSignOff = function(search) {
                    scope.item.sign_off = search;
                    autosave.save(scope.item, scope.origItem);
                };

                /**
                 * Change the edit mode for Sign-Off input
                 */
                scope.changeSignOffEdit = function() {
                    scope.editSignOff = !scope.editSignOff;
                };

                /**
                 * Updates the sign_off field with the new value generated on the server side
                 * once the story is saved
                 */
                scope.$watch('origItem.sign_off', (newValue, oldValue) => {
                    if (newValue !== oldValue) {
                        scope.item.sign_off = newValue;
                    }
                });

                /**
                 * Invoked when user selects a different day in dateline day list. This method calculates the
                 * relative UTC based on the new values of month and day and sets to dateline.date.
                 *
                 * @param {String} datelineDay - the selected day
                 */
                scope.modifyDatelineDate = function(datelineDay) {
                    if (scope.dateline.month !== '' && scope.dateline.day !== '') {
                        if (datelineDay) {
                            scope.dateline.day = datelineDay;
                        }

                        scope.item.dateline.date = $filter('relativeUTCTimestamp')(scope.item.dateline.located,
                            parseInt(scope.dateline.month, 10), parseInt(scope.dateline.day, 10));

                        scope.item.dateline.text = $filter('formatDatelineText')(scope.item.dateline.located,
                            $interpolate('{{ month | translate }}')({
                                month: _.findKey(scope.monthNames, (m) => m === scope.dateline.month),
                            }),
                            scope.dateline.day, scope.item.dateline.source);

                        mainEditScope.dirty = true;
                        autosave.save(scope.item, scope.origItem);
                    }
                };

                /**
                 * @ngdoc method
                 * @name sdArticleEdit#editMedia
                 *
                 * @description Opens the Change Image Controller to modify the image metadata.
                 */
                scope.editMedia = (defaultTab = 'view') => {
                    let showTabs = [];

                    scope.mediaLoading = true;

                    if (scope.item.type === 'picture' && scope.metadata.crop_sizes) {
                        showTabs = ['view', 'image-edit', 'crop'];
                    } else if (scope.item.type === 'picture' && !scope.metadata.crop_sizes) {
                        showTabs = ['view', 'image-edit'];
                    } else {
                        showTabs = ['view'];
                    }

                    return renditions.crop(
                        scope.item,
                        {
                            isNew: false,
                            editable: true,
                            isAssociated: false,
                            defaultTab: defaultTab,
                            tabs: showTabs,
                            showMetadata: true,
                        }
                    )
                        .then((picture) => {
                            scope.item._etag = picture._etag;

                            if (authoring.isPublished(scope.item)) {
                                mainEditScope.dirty = true;

                                // mark dirty in multiedit mode.
                                if (scope.articleEdit) {
                                    scope.articleEdit.$setDirty();
                                }
                            } else {
                                scope.save();
                            }
                        })
                        .finally(() => {
                            scope.mediaLoading = false;
                        });
                };

                /**
                 * @ngdoc method
                 * @name sdArticleEdit#applycrop
                 *
                 * @description Opens the Change Image Controller to modify the image metadata and crops.
                 */
                scope.applyCrop = function() {
                    return this.editMedia('crop');
                };

                /**
                 * Adds the selected Helpline to the item allowing user for further edit.
                 */
                scope.addHelplineToFooter = function() {
                    // determine and ignore if footer text have empty tags
                    var container = document.createElement('div');

                    container.innerHTML = scope.item.body_footer;

                    if (!scope.item.body_footer || container.textContent === '') {
                        scope.item.body_footer = '';
                    }

                    if (scope.extra.body_footer_value) {
                        scope.item.body_footer = scope.item.body_footer + scope.extra.body_footer_value.value;
                        mainEditScope.dirty = true;
                        autosave.save(scope.item, scope.origItem);
                    }

                    // first option should always be selected, as multiple helplines could be added in footer
                    _.defer(() => {
                        var ddlHelpline = elem.find('#helplines');

                        ddlHelpline[0].options[0].selected = true;
                    });
                };

                // Returns the maximum number upload files
                scope.maxUploads = function(fieldOptions) {
                    if (fieldOptions && fieldOptions.multiple_items &&
                        fieldOptions.multiple_items.enabled) {
                        return fieldOptions.multiple_items.max_items ? fieldOptions.multiple_items.max_items : 0;
                    }
                    return 1;
                };

                scope.toggleSMS = () => {
                    const isMarked = _.get(scope, 'item.flags.marked_for_sms');
                    const field = _.get(scope, 'editor.sms.sourceField', 'abstract');

                    if (isMarked) {
                        scope.item.sms_message = scope.item.sms_message || scope.item[field] || '';
                    } else if (scope.item) {
                        scope.item.sms_message = '';
                    }
                };

                scope.$watch('item.body_html', () => suggest.trigger(scope.item, scope.origItem));

                scope.$watch('item.profile', (profile) => {
                    if (profile) {
                        content.getType(profile)
                            .then((type) => {
                                scope.contentType = type;
                                scope.editor = authoring.editor = content.editor(type, scope.item.type);
                                scope.schema = authoring.schema = content.schema(type, scope.item.type);
                                scope.fields = content.fields(type);
                            });
                    } else {
                        scope.editor = authoring.editor = content.editor(null, scope.item.type);
                        scope.schema = authoring.schema = content.schema(null, scope.item.type);
                        scope.fields = null;
                    }
                });

                scope.extra = {}; // placeholder for fields not part of item
            });
        },
    };
}
