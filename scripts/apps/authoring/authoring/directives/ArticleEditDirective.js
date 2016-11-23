ArticleEditDirective.$inject = [
    'autosave',
    'authoring',
    'metadata',
    '$filter',
    'superdesk',
    'content',
    'renditions',
    'config',
    'session',
    'gettext',
    'history',
    '$interpolate',
    'suggest'
];
export function ArticleEditDirective(
    autosave,
    authoring,
    metadata,
    $filter,
    superdesk,
    content,
    renditions,
    config,
    session,
    gettext,
    history,
    $interpolate,
    suggest
) {
    return {
        templateUrl: 'scripts/apps/authoring/views/article-edit.html',
        link: function(scope, elem) {
            scope.toggleDetails = true;
            scope.errorMessage = null;
            scope.contentType = null;
            scope.canListEditSignOff = config.user && config.user.sign_off_mapping;
            scope.editSignOff = false;

            var mainEditScope = scope.$parent.$parent;
            var autopopulateByline = config.features && config.features.autopopulateByline;

            /* Start: Dateline related properties */

            scope.monthNames = {'Jan': '0', 'Feb': '1', 'Mar': '2', 'Apr': '3', 'May': '4', 'Jun': '5',
                'Jul': '6', 'Aug': '7', 'Sep': '8', 'Oct': '9', 'Nov': '10', 'Dec': '11'};

            scope.dateline = {
                month: '',
                day: ''
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
                    mainEditScope.$applyAsync(function() {
                        mainEditScope.autosave(mainEditScope.item);
                    });
                }
            }

            scope.$watch('item', function(item) {
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
                        item.byline = $interpolate(gettext('By {{ display_name }}'))
                            ({display_name: session.identity.display_name});
                    }
                }
            });

            metadata.initialize().then(function() {
                scope.metadata = metadata.values;

                if (scope.item && scope.item.type === 'picture') {
                    scope.item.hasCrops = false;
                    scope.item.hasCrops = scope.metadata.crop_sizes.some(function(crop) {
                        return scope.item.renditions && scope.item.renditions[crop.name];
                    });
                }

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
                    item.dateline.located = null;
                    item.dateline.text = '';

                    scope.dateline.month = '';
                    scope.dateline.day = '';
                } else {
                    var monthAndDay = $filter('parseDateline')(item.dateline.date, item.dateline.located);

                    scope.dateline.month = monthAndDay.month;
                    scope.dateline.day = monthAndDay.day;
                    scope.resetNumberOfDays(false);

                    item.dateline.text = $filter('formatDatelineText')(item.dateline.located,
                        $interpolate('{{ month | translate }}')
                        ({month: _.findKey(scope.monthNames, function(m) {
                            return m === scope.dateline.month;
                        })}),
                        scope.dateline.day, item.dateline.source);
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
                    scope.daysInMonth = $filter('daysInAMonth')(parseInt(scope.dateline.month));

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
                            parseInt(scope.dateline.month), parseInt(scope.dateline.day));

                    scope.item.dateline.text = $filter('formatDatelineText')(scope.item.dateline.located,
                        $interpolate('{{ month | translate }}')
                        ({month: _.findKey(scope.monthNames, function(m) {
                            return m === scope.dateline.month;
                        })}),
                        scope.dateline.day, scope.item.dateline.source);

                    mainEditScope.dirty = true;
                    autosave.save(scope.item, scope.origItem);
                }
            };

            scope.applyCrop = function() {
                var poi = {x: 0.5, y: 0.5};
                superdesk.intent('edit', 'crop', {
                    item: scope.item,
                    renditions: scope.metadata.crop_sizes,
                    poi: scope.item.poi || poi,
                    showMetadataEditor: true,
                    isNew: false
                })
                    .then(function(result) {
                        var renditions = _.create(scope.item.renditions || {});
                        // always mark dirty as poi could have changed with no
                        // cropData changes
                        mainEditScope.dirty = true;
                        // mark dirty in multiedit mode
                        if (scope.articleEdit) {
                            scope.articleEdit.$setDirty();
                        }
                        angular.forEach(result.cropData, function(crop, rendition) {
                            renditions[rendition] = angular.extend({}, renditions[rendition] || {}, crop);
                        });

                        scope.item.renditions = renditions;
                    });
            };

            /**
             * Adds the selected Helpline to the item allowing user for further edit.
             */
            scope.addHelplineToFooter = function() {
                //determine and ignore if footer text have empty tags
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

                //first option should always be selected, as multiple helplines could be added in footer
                _.defer (function() {
                    var ddlHelpline = elem.find('#helplines');
                    ddlHelpline[0].options[0].selected = true;
                });
            };

            scope.$watch('item.body_html', () => suggest.trigger(scope.item, scope.origItem));

            scope.$watch('item.flags.marked_for_sms', function(isMarked) {
                if (isMarked) {
                    scope.item.sms_message = scope.item.sms_message || scope.item.abstract || '';
                } else if (scope.item) {
                    scope.item.sms_message = '';
                }
            });

            scope.$watch('item.profile', function(profile) {
                if (profile) {
                    content.getType(profile)
                        .then(function(type) {
                            scope.contentType = type;
                            scope.editor = authoring.editor = content.editor(type);
                            scope.schema = authoring.schema = content.schema(type);
                        });
                } else {
                    scope.editor = authoring.editor = content.editor();
                    scope.schema = authoring.schema = content.schema();
                }
            });

            scope.extra = {}; // placeholder for fields not part of item
        }
    };
}
