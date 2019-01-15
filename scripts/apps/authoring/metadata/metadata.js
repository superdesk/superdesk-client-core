import _ from 'lodash';
import PreferedCvItemsConfigDirective from './PreferedCvItemsConfigDirective';
import MetaPlaceDirective from './MetaPlaceDirective';
import {VOCABULARY_SELECTION_TYPES} from '../../vocabularies/constants';

const SINGLE_SELECTION = VOCABULARY_SELECTION_TYPES.SINGLE_SELECTION.id;

MetadataCtrl.$inject = [
    '$scope', 'desks', 'metadata', 'privileges', 'datetimeHelper',
    'preferencesService', 'config', 'moment', 'content',
];

function MetadataCtrl(
    $scope, desks, metadata, privileges, datetimeHelper,
    preferencesService, config, moment, content) {
    desks.initialize();

    $scope.change_profile = config.item_profile && config.item_profile.change_profile === 1 &&
                            _.get($scope, 'origItem.type') === 'text';

    metadata.initialize().then(() => {
        $scope.metadata = metadata.values;
        return preferencesService.get();
    })
        .then(setAvailableCategories)
        .then(setAvailableCompanyCodes);

    $scope.$watch(() => desks.active.desk, (activeDeskId) => {
        content.getDeskProfiles(activeDeskId ? desks.getCurrentDesk() : null, $scope.item.profile)
            .then((profiles) => {
                $scope.desk_content_types = profiles;
            });
    });

    $scope.processGenre = function() {
        $scope.item.genre = _.map($scope.item.genre, (g) => _.pick(g, 'name'));
    };

    /**
    * Builds a list of categories available for selection in scope. Used by
    * the "category" menu in the Authoring metadata section.
    *
    * @function setAvailableCategories
    * @param {Object} prefs - user preferences setting, including the
    *   preferred categories settings, among other things
    */
    function setAvailableCategories(prefs) {
        var all, // all available categories
            assigned = {}, // category codes already assigned to the article
            filtered,
            itemCategories, // existing categories assigned to the article

            // user's category preference settings , i.e. a map
            // object (<category_code> --> true/false)
            userPrefs;

        all = metadata.values.categories || [];
        userPrefs = prefs['categories:preferred'].selected;

        // gather article's existing category codes
        itemCategories = $scope.item.anpa_category || [];

        itemCategories.forEach((cat) => {
            assigned[cat.qcode] = true;
        });

        filtered = _.filter(all, (cat) => !assigned[cat.qcode] && (_.isEmpty(userPrefs) || userPrefs[cat.qcode]));

        $scope.availableCategories = _.sortBy(filtered, 'name');
    }

    /**
    * Builds a list of company_codes available for selection in scope. Used by
    * the "company_codes" menu in the Authoring metadata section.
    *
    * @function setAvailableCompanyCodes
    */
    function setAvailableCompanyCodes() {
        var all, // all available company codes
            assigned = {}, // company codes already assigned to the article
            filtered,
            itemCompanyCodes; // existing company codes assigned to the article

        all = _.cloneDeep(metadata.values.company_codes || []);

        all.forEach((companyCode) => {
            companyCode.name = companyCode.name + ' (' + companyCode.qcode + ')';
        });

        // gather article's existing company codes
        itemCompanyCodes = $scope.item.company_codes || [];

        itemCompanyCodes.forEach((companyCode) => {
            assigned[companyCode.qcode] = true;
        });

        filtered = _.filter(all, (companyCode) => !assigned[companyCode.qcode]);

        $scope.availableCompanyCodes = _.sortBy(filtered, 'name');
    }

    $scope.$watch('item.publish_schedule_date', (newValue, oldValue) => {
        setPublishScheduleDate(newValue, oldValue);
    });

    $scope.$watch('item.publish_schedule_time', (newValue, oldValue) => {
        setPublishScheduleDate(newValue, oldValue);
    });

    $scope.$watch('item.time_zone', (newValue, oldValue) => {
        if ((newValue || oldValue) && newValue !== oldValue) {
            setTimeZone();
            setPublishScheduleDate(newValue, oldValue);
            setEmbargoTS(newValue, oldValue);

            if (!$scope.item.publish_schedule && !$scope.item.embargo) {
                $scope.item.schedule_settings = null;
            }
        }
    });

    function setTimeZone() {
        $scope.item.schedule_settings = {};
        if (!$scope.item.time_zone) {
            $scope.item.schedule_settings.time_zone = null;
        } else {
            $scope.item.schedule_settings.time_zone = $scope.item.time_zone;
        }
    }

    function setPublishScheduleDate(newValue, oldValue) {
        if ((newValue || oldValue) && newValue !== oldValue) {
            if ($scope.item.publish_schedule_date && $scope.item.publish_schedule_time) {
                $scope.item.publish_schedule = datetimeHelper.mergeDateTime(
                    $scope.item.publish_schedule_date,
                    $scope.item.publish_schedule_time,
                    $scope.item.time_zone
                );
                setTimeZone();
            } else {
                $scope.item.publish_schedule = null;
            }

            $scope.autosave($scope.item);
        }
    }

    $scope.$watch('item.embargo_date', (newValue, oldValue) => {
        // set embargo time default on initial date selection
        if (newValue && oldValue === undefined) {
            $scope.item.embargo_time = moment('00:01', 'HH:mm')
                .format(config.model.timeformat);
        }

        setEmbargoTS(newValue, oldValue);
    });

    $scope.$watch('item.embargo_time', (newValue, oldValue) => {
        setEmbargoTS(newValue, oldValue);
    });

    /**
     * Listener method which gets invoked when either Embargo Date or Embargo Time has changed. This function takes
     * values of both Embargo Date and Embargo Time to form Timestamp.
     */
    function setEmbargoTS(newValue, oldValue) {
        if ((newValue || oldValue) && newValue !== oldValue) {
            if ($scope.item.embargo_date && $scope.item.embargo_time) {
                $scope.item.embargo = datetimeHelper.mergeDateTime(
                    $scope.item.embargo_date,
                    $scope.item.embargo_time,
                    $scope.item.time_zone
                );
                setTimeZone();
            } else {
                $scope.item.embargo = null;
            }

            $scope.autosave($scope.item);
        }
    }

    /**
     * Publish Schedule and Embargo are saved as Timestamps in DB but each field has date and time as two different
     * inputs in UI. This function breaks the timestamp fetched from API to Date and Time and assigns those values to
     * the appropriate field.
     */
    function resolvePublishScheduleAndEmbargoTS() {
        var info;
        var embargo = datetimeHelper.removeTZ($scope.item.embargo);
        var publishSchedule = datetimeHelper.removeTZ($scope.item.publish_schedule);

        if ($scope.item.schedule_settings) {
            $scope.item.time_zone = $scope.item.schedule_settings.time_zone;
            if ($scope.item.schedule_settings.utc_embargo) {
                embargo = $scope.item.schedule_settings.utc_embargo;
            }

            if ($scope.item.schedule_settings.utc_publish_schedule) {
                publishSchedule = $scope.item.schedule_settings.utc_publish_schedule;
            }
        }

        if (embargo) {
            info = datetimeHelper.splitDateTime(embargo, $scope.item.time_zone);
            $scope.item.embargo_date = info.date;
            $scope.item.embargo_time = info.time;
        }

        if (publishSchedule) {
            info = datetimeHelper.splitDateTime(publishSchedule, $scope.item.time_zone);
            $scope.item.publish_schedule_date = info.date;
            $scope.item.publish_schedule_time = info.time;
        }
    }

    $scope.unique_name_editable = Boolean(privileges.privileges.metadata_uniquename &&
        $scope.action !== 'correct' && $scope.action !== 'kill');

    $scope.targetsEditable = $scope.action !== 'correct' && $scope.action !== 'kill';

    resolvePublishScheduleAndEmbargoTS();
}

MetaTargetedPublishingDirective.$inject = [];
function MetaTargetedPublishingDirective() {
    return {
        scope: {
            list: '=',
            disabled: '=ngDisabled',
            targets: '=',
            autosave: '&',
        },
        templateUrl: 'scripts/apps/authoring/metadata/views/metadata-target-publishing.html',
        link: function(scope, elem) {
            scope.removeTarget = function(target) {
                scope.targets = _.without(scope.targets, target);
                scope.autosave();
            };

            scope.addTarget = function(target) {
                if (angular.isUndefined(scope.targets)) {
                    scope.targets = [];
                }

                let parsedTarget = JSON.parse(target);

                var existing = _.find(scope.targets,
                    {qcode: parsedTarget.qcode, name: parsedTarget.name, allow: !scope.deny});

                if (!existing) {
                    scope.targets.push({qcode: parsedTarget.qcode, name: parsedTarget.name, allow: !scope.deny});
                    scope.autosave();
                }

                reset();
            };

            function reset() {
                scope.target = '';
                scope.deny = false;
            }

            scope.canAddTarget = function() {
                return scope.disabled || !scope.target || scope.target === '';
            };
        },
    };
}

MetadropdownFocusDirective.$inject = ['keyboardManager'];
function MetadropdownFocusDirective(keyboardManager) {
    return {
        require: 'dropdown',
        link: function(scope, elem, attrs, dropdown) {
            scope.$watch(dropdown.isOpen, (isOpen) => {
                if (isOpen) {
                    _.defer(() => {
                        var keyboardOptions = {inputDisabled: false, propagate: false};
                        // narrow the selection to consider only dropdown list's button items
                        var buttonList = elem.find('.dropdown__menu button');

                        if (buttonList.length > 0) {
                            buttonList[0].focus();
                        }

                        keyboardManager.push('up', () => {
                            if (buttonList.length > 0) {
                                var focusedElem = elem.find('button:focus')[0];
                                var indexValue = _.findIndex(buttonList, (chr) => chr === focusedElem);
                                // select previous item on key UP

                                if (indexValue > 0 && indexValue < buttonList.length) {
                                    buttonList[indexValue - 1].focus();
                                }
                            }
                        }, keyboardOptions);

                        keyboardManager.push('down', () => {
                            if (buttonList.length > 0) {
                                var focusedElem = elem.find('button:focus')[0];
                                var indexValue = _.findIndex(buttonList, (chr) => chr === focusedElem);
                                // select next item on key DOWN

                                if (indexValue < buttonList.length - 1) {
                                    buttonList[indexValue + 1].focus();
                                }
                            }
                        }, keyboardOptions);
                    });
                } else if (isOpen === false) {
                    keyboardManager.pop('down');
                    keyboardManager.pop('up');
                }
            });
        },
    };
}

MetaDropdownDirective.$inject = ['$filter'];
function MetaDropdownDirective($filter) {
    return {
        scope: {
            list: '=',
            disabled: '=ngDisabled',
            item: '=',
            field: '@',
            icon: '@',
            label: '@',
            change: '&',
            key: '@',
            tabindex: '=',
            containingDirective: '@',
        },
        templateUrl: 'scripts/apps/authoring/metadata/views/metadata-dropdown.html',
        link: function(scope, elem) {
            scope.listFields = ['place', 'genre', 'anpa_category', 'subject', 'authors'];

            scope.select = function(item) {
                var o = {};

                if (item) {
                    o[scope.field] = scope.key ? item[scope.key] : [item];
                } else {
                    o[scope.field] = null;
                }

                _.extend(scope.item, o);
                scope.change({item: scope.item, field: scope.field});

                // retain focus on same dropdown control after selection.
                _.defer(() => {
                    elem.find('.dropdown__toggle').focus();
                });

                if (scope.values) {
                    scope.selected = scope.values[o[scope.field]] || null;
                }
            };

            scope.$watch(':: list', () => {
                scope.values = _.keyBy(scope.list, 'qcode');
            });

            // UI binding assignment only if we are editing a content profile (NOT in authoring header or other places)
            if (scope.containingDirective === 'sdContentSchemaEditor') {
                scope.item[scope.field] = scope.item.default;
            }

            scope.$applyAsync(() => {
                if (scope.list) {
                    if (scope.field === 'place') {
                        scope.places = _.groupBy(scope.list, 'group');
                    } else if (scope.field === 'genre') {
                        scope.list = $filter('sortByName')(scope.list);
                    }
                }
            });
        },
    };
}

MetaTagsDirective.$inject = ['api', '$timeout'];
function MetaTagsDirective(api, $timeout) {
    var ENTER = 13;
    var ESC = 27;

    return {
        scope: {
            item: '=',
            field: '@',
            sourceField: '@',
            change: '&',
            disabled: '=',
        },
        templateUrl: 'scripts/apps/authoring/metadata/views/metadata-tags.html',
        link: function(scope, element) {
            var inputElem = element.find('input')[0];

            scope.adding = false;
            scope.refreshing = false;
            scope.newTag = null;
            scope.tags = null;
            scope.extractedTags = null;
            scope.item[scope.field] = scope.item[scope.field] || [];

            var add = function(tag) {
                scope.tags.push(tag);
                scope.tags = _.uniq(scope.tags);
                scope.toggle(tag);
                cancel();
            };

            var cancel = function() {
                scope.newTag = null;
                scope.adding = false;
            };

            scope.$watch('adding', () => {
                if (scope.adding) {
                    $timeout(() => {
                        inputElem.focus();
                    }, 0, false);
                }
            });

            scope.key = function($event) {
                if ($event.keyCode === ENTER && !$event.shiftKey) {
                    add(scope.newTag);
                } else if ($event.keyCode === ESC && !$event.shiftKey) {
                    cancel();
                }
            };

            scope.isSelected = function(tag) {
                return scope.item[scope.field].indexOf(tag) !== -1;
            };

            scope.toggle = function(tag) {
                if (!scope.disabled) {
                    if (scope.isSelected(tag)) {
                        _.pull(scope.item[scope.field], tag);
                    } else {
                        scope.item[scope.field].push(tag);
                    }
                    scope.change({item: scope.item});
                }
            };

            scope.refresh = function() {
                scope.refreshing = true;
                var body = (scope.item[scope.sourceField] || '')
                    .replace(/<br[^>]*>/gi, '&nbsp;')
                    .replace(/(<figcaption\b[^>]*>)[^<>]*(<\/figcaption>)/gi, '')
                    .replace(/<\/?[^>]+>/gi, '')
                    .trim()
                    .replace(/&nbsp;/g, ' ');

                if (body) {
                    api.save('keywords', {text: body})
                        .then((result) => {
                            scope.extractedTags = _.map(result.keywords, 'text');
                            scope.tags = _.uniq(scope.extractedTags.concat(scope.item[scope.field]));
                            scope.refreshing = false;
                        });
                } else {
                    scope.refreshing = false;
                }
            };

            scope.refresh();
        },
    };
}

MetaWordsListDirective.$inject = [];
function MetaWordsListDirective() {
    return {
        scope: {
            item: '=',
            field: '@',
            disabled: '=',
            list: '=',
            change: '&',
            header: '@',
            style: '@',
        },
        template: require('./views/metadata-words-list.html'),
        link: function(scope, element) {
            scope.words = [];
            scope.selectedTerm = '';

            scope.$applyAsync(() => {
                element.find('input, select').addClass('line-input');

                if (scope.list) {
                    scope.words = scope.list;
                }
            });

            /**
             * sdTypeahead directive invokes this method and is responsible for searching word(s) where the word.name
             * matches wordToFind.
             *
             * @return {Array} list of word(s)
             */
            scope.search = function(wordToFind) {
                if (!wordToFind) {
                    scope.words = scope.list;
                } else {
                    scope.words = _.filter(scope.list,
                        (t) => t.name.toLowerCase().indexOf(wordToFind.toLowerCase()) !== -1);
                }

                scope.selectedTerm = wordToFind;
                return scope.words;
            };

            /**
             * sdTypeahead directive invokes this method and is responsible for updating the item with user selected
             * word.
             *
             * @param {Object} item selected word object
             */
            scope.select = function(item) {
                var keyword = item ? item.qcode : scope.selectedTerm;
                var t = _.clone(scope.item[scope.field]) || [];
                var index = _.findIndex(t, (word) => word.toLowerCase() === keyword.toLowerCase());

                if (index < 0) {
                    t.push(keyword);

                    var o = {};

                    o[scope.field] = t;
                    _.extend(scope.item, o);
                    scope.change({item: scope.item});
                }

                scope.selectedTerm = '';
            };

            /**
             * Removes the term from the user selected terms
             */
            scope.removeTerm = function(term) {
                var temp = _.without(scope.item[scope.field], term);

                // build object
                var o = {};

                o[scope.field] = temp;

                _.extend(scope.item, o);

                scope.change({item: scope.item});
            };
        },
    };
}

/**
 * Wraping  'sd-typeahead' directive for editing of metadata list attributes
 *
 * @param {Object} item - specify the content item itself
 * @param {String} field - specify the (metadata) filed under the item which will be edited
 * @param {Boolean} disabled - whether component should be disabled for editing or not
 * @param {Array} list - list of available values that can be added
 * @param {String} unique - specify the name of the field, in list item which is unique (qcode, value...)
 * @param {Boolean} searchUnique - to search unique field as well as name field
 * @param {Boolean} selectEntireCategory - to allow a whole category to be selected (i.e. field without parent)
 *
 */
MetaTermsDirective.$inject = ['metadata', '$filter', '$timeout', 'preferencesService', 'desks'];
function MetaTermsDirective(metadata, $filter, $timeout, preferencesService, desks) {
    return {
        scope: {
            item: '=',
            field: '@',
            disabled: '=ngDisabled',
            list: '=',
            unique: '@',
            postprocessing: '&',
            change: '&',
            header: '@',
            reloadList: '@',
            cv: '=',
            includeParent: '@',
            tabindex: '=',
            searchUnique: '@',
            setLanguage: '@',
            helperText: '@',
            selectEntireCategory: '@',
        },
        templateUrl: 'scripts/apps/authoring/metadata/views/metadata-terms.html',
        link: function(scope, elem, attrs) {
            metadata.subjectScope = scope;
            var reloadList = scope.reloadList === 'true';
            var includeParent = scope.includeParent === 'true';
            var searchUnique = scope.searchUnique === 'true';

            // we want true as default value to keep legacy behaviour
            scope.allowEntireCat = scope.selectEntireCategory !== 'false';

            scope.combinedList = [];

            scope.tree = {};
            scope.termPath = [];

            scope.$watch('unique', (value) => {
                scope.uniqueField = value || 'qcode';
            });

            scope.$watch('list', (items) => {
                if (!items || items.length === 0) {
                    return;
                }

                var tree = {}, updates = {};

                if (scope.cv && scope.cv.dependent) {
                    updates[scope.field] = [];
                }

                angular.forEach(items, (item) => {
                    var parent = item.parent || null;

                    if (!tree.hasOwnProperty(parent)) {
                        tree[parent] = [item];
                    } else {
                        tree[parent].push(item);
                    }

                    // checks for dependent dropdowns to remain selected items if new list has them (not to reset)
                    angular.forEach(scope.item[scope.field], (selectedItem) => {
                        if (scope.cv && scope.cv.dependent) {
                            if (selectedItem.scheme === scope.cv._id) {
                                if (item.name === selectedItem.name) {
                                    updates[scope.field].push(selectedItem);
                                }
                            // this is for subject (which is not dependent)
                            } else if (updates[scope.field].indexOf(selectedItem) === -1) {
                                updates[scope.field].push(selectedItem);
                            }
                        }
                    });
                });

                _.extend(scope.item, updates);

                scope.terms = filterSelected(items);
                scope.tree = tree;
                scope.activeTree = tree.null;
                scope.combinedList = _.union(scope.list, scope.item[scope.field] ? scope.item[scope.field] : []);
                setPreferredItems();
            });

            scope.$watch('item[field]', (selected) => {
                if (!selected) {
                    scope.selectedItems = [];
                    return;
                }

                scope.terms = filterSelected(scope.list);
                if (_.get(scope, 'cv._id')) { // filter out items from current cv
                    scope.selectedItems = selected.filter((term) => term.scheme === (scope.cv._id || scope.cv.id));
                } else {
                    scope.selectedItems = selected.filter((term) => !term.scheme || term.scheme === scope.field);
                }
            });

            scope.$on('$destroy', () => {
                metadata.subjectScope = null;
            });

            scope.openParent = function(term, $event) {
                var parent = _.find(scope.list, {[scope.uniqueField]: term.parent});

                scope.openTree(parent, $event);
            };

            scope.openTree = function(term, $event) {
                if ($event.altKey) {
                    let activeTree = scope.tree[term ? term[scope.uniqueField] : null];

                    return angular.forEach(activeTree, (term) => {
                        scope.selectTerm(term, $event);
                    });
                }

                scope.activeTerm = term;
                scope.termPath.push(term);
                scope.activeTree = scope.tree[term ? term[scope.uniqueField] : null];
                $event.stopPropagation();
                _.defer(() => {
                    const el = elem.find('button:not([disabled]):not(.dropdown__toggle)');

                    if (
                        typeof el === 'object'
                        && el != null
                        && typeof el[0] === 'object'
                        && typeof el[0].focus === 'function'
                    ) {
                        el[0].focus();
                    }
                });
                scope.activeList = false;
            };

            scope.isSelected = (term) => !!_.find(scope.item[scope.field], term);

            scope.activeList = false;
            scope.selectedTerm = '';

            scope.searchTerms = function(term) {
                if (!term) {
                    scope.terms = filterSelected(scope.list);
                    scope.activeList = false;
                } else {
                    var searchList;

                    if (!scope.allowEntireCat) {
                        searchList = _.filter(scope.list, (item) => !item.parent);
                    } else {
                        searchList = reloadList ? scope.list : scope.combinedList;
                    }

                    scope.terms = $filter('sortByName')(_.filter(filterSelected(searchList), (t) => {
                        var searchObj = {};

                        searchObj[scope.uniqueField] = t[scope.uniqueField];
                        if (searchUnique) {
                            return (t.name.toLowerCase().indexOf(term.toLowerCase()) !== -1 ||
                                    t[scope.uniqueField].toLowerCase().indexOf(term.toLowerCase()) !== -1) &&
                                !_.find(scope.item[scope.field], searchObj);
                        }

                        return t.name.toLowerCase().indexOf(term.toLowerCase()) !== -1 &&
                            !_.find(scope.item[scope.field], searchObj);
                    }));
                    scope.activeList = true;
                }
                return scope.terms;
            };

            function filterSelected(terms) {
                var selected = {};

                angular.forEach(scope.item[scope.field], (term) => {
                    if (term) {
                        selected[term[scope.uniqueField]] = 1;
                    }
                });

                return _.filter(terms, (term) => term && !selected[term[scope.uniqueField]]);
            }

            function addTerm(term) {
                if (!term) {
                    return;
                }

                let isSelected = filterSelected([term]).length === 0;

                // Only select terms that are not already selected
                if (!isSelected) {
                    // instead of simple push, extend the item[field] in order to trigger dirty $watch
                    var t = [];

                    if (term.selection_type !== SINGLE_SELECTION) {
                        t = _.clone(scope.item[scope.field]) || [];
                    }

                    if (scope.cv && scope.cv.selection_type === SINGLE_SELECTION) {
                        t = _.filter(t, (term) => term.scheme !== scope.cv._id);
                    }

                    // build object
                    var o = {};

                    if (term.language && scope.setLanguage) {
                        o.language = term.language;
                    }

                    t.push(angular.extend({}, term, {
                        scheme: scope.cv ? scope.cv._id : null,
                    }));

                    o[scope.field] = t;
                    _.extend(scope.item, o);
                }
            }

            scope.selectTerm = function(term, $event) {
                if (term) {
                    addTerm(term);

                    if (includeParent) {
                        scope.termPath.forEach((term) => {
                            addTerm(term);
                        });
                    }

                    if ($event && ($event.ctrlKey || $event.metaKey)) {
                        $event.stopPropagation();
                        return;
                    }

                    scope.activeTerm = '';
                    scope.selectedTerm = '';
                    scope.termPath = [];
                    scope.searchTerms();

                    if (!reloadList) {
                        // Remove the selected term from the terms
                        scope.terms = _.without(scope.terms, term);
                        scope.activeTree = scope.terms;
                    }

                    $timeout(() => {
                        scope.$applyAsync(() => {
                            scope.postprocessing();
                            scope.change({item: scope.item, field: scope.field});
                        });
                    }, 50, false);

                    // retain focus and initialise activeTree on same dropdown control after selection.
                    _.defer(() => {
                        if (!_.isEmpty(elem.find('.dropdown__toggle'))) {
                            elem.find('.dropdown__toggle').focus();
                        }
                        if (reloadList) {
                            scope.activeTerm = null;
                            scope.searchTerms(null);
                            scope.activeTree = scope.tree.null;
                        } else {
                            scope.terms = _.clone(scope.activeTree) || [];
                            scope.allSelected = scope.terms.length === 0;
                        }
                    });
                }
            };

            scope.removeTerm = function(term) {
                var tempItem = {},
                    subjectCodesArray = scope.item[scope.field],
                    filteredArray = _.without(subjectCodesArray, term);

                if (subjectCodesArray && filteredArray.length === subjectCodesArray.length) {
                    _.remove(filteredArray, {name: term});
                }

                tempItem[scope.field] = filteredArray;

                _.extend(scope.item, tempItem);

                if (!reloadList) {
                    scope.terms.push(term);
                    if (scope.activeTree.find((item) => item.qcode === term.qcode) == null) {
                        scope.activeTree.push(term);
                    }
                    scope.activeTree = $filter('sortByName')(scope.activeTree);
                    scope.allSelected = false;
                }

                scope.terms = $filter('sortByName')(scope.terms);
                scope.change({item: scope.item, field: scope.field});
                elem.find('.dropdown__toggle').focus(); // retain focus
            };

            scope.getLocaleName = function(term) {
                if (!term) {
                    return 'None';
                }
                if (term.translations && scope.item.language
                    && term.translations.name[scope.item.language]) {
                    return term.translations.name[scope.item.language];
                }

                return term.name;
            };

            scope.setPreferredView = (view, $event) => {
                scope.preferredView = view;
                $event.stopPropagation();

                if (scope.activeTerm) {
                    scope.openParent({}, $event);
                }
            };

            function setPreferredItems() {
                scope.preferredView = null;
                scope.userPreferredItems = [];
                scope.deskPreferredItems = [];
                if (_.get(scope, 'cv._id')) {
                    preferencesService.get('cvs:preferred_items').then((prefered) => {
                        const userPrefs = _.get(prefered, 'value', {});
                        const deskPrefs = _.get(desks.getCurrentDesk(), 'preferred_cv_items', {});

                        scope.userPreferredItems = getPreferredItems(userPrefs);
                        scope.deskPreferredItems = getPreferredItems(deskPrefs);

                        if (scope.userPreferredItems.length) {
                            scope.preferredView = 'user';
                        } else if (scope.deskPreferredItems.length) {
                            scope.preferredView = 'desk';
                        }
                    });
                }
            }

            function getPreferredItems(prefs) {
                const preferredItems = _.get(prefs, scope.cv._id, []);

                return preferredItems
                    .map((preferedItem) =>
                        scope.list.find((item) => item[scope.uniqueField] === preferedItem[scope.uniqueField]))
                    .filter((item) => item != null); // filter out items missing in cv
            }
        },
    };
}

MetaLocatorsDirective.$inject = [];
function MetaLocatorsDirective() {
    return {
        scope: {
            item: '=',
            fieldprefix: '@',
            field: '@',
            disabled: '=ngDisabled',
            list: '=',
            change: '&',
            postprocessing: '&',
            header: '@',
            tabindex: '=',
            keepinput: '=',
        },

        templateUrl: 'scripts/apps/authoring/metadata/views/metadata-locators.html',
        link: function(scope, element) {
            scope.selectedTerm = '';
            scope.locators = [];

            scope.$applyAsync(() => {
                if (scope.item) {
                    if (scope.fieldprefix && scope.item[scope.fieldprefix] &&
                        scope.item[scope.fieldprefix][scope.field]) {
                        scope.selectedTerm = scope.item[scope.fieldprefix][scope.field].city;
                    } else if (scope.item[scope.field]) {
                        scope.selectedTerm = scope.item[scope.field].city;
                    }
                }

                if (scope.list) {
                    setLocators(scope.list);
                }
            });

            function setLocators(list) {
                scope.locators = list.slice(0, 10);
                scope.total = list.length;
            }

            // update visible city on some external change, like after undo/redo
            scope.$watch('item[fieldprefix][field].city || item[field].city', (located) => {
                scope.selectedTerm = located;
            });

            /**
             * sdTypeahead directive invokes this method and is responsible for searching located object(s) where the
             * city name matches locatorToFind.
             *
             * @return {Array} list of located object(s)
             */
            scope.searchLocator = function(locatorToFind) {
                if (!locatorToFind) {
                    setLocators(scope.list);
                } else {
                    setLocators(_.filter(scope.list,
                        (t) => t.city.toLowerCase().indexOf(locatorToFind.toLowerCase()) !== -1));
                }

                scope.selectedTerm = locatorToFind;
                return scope.locators;
            };

            /**
             * sdTypeahead directive invokes this method and is responsible for updating the item with user selected
             * located object.
             *
             * @param {Object} locator user selected located object
             */
            scope.selectLocator = function(locator) {
                var updates = {};
                let loc = locator;

                if (!loc && scope.selectedTerm) {
                    var previousLocator = scope.fieldprefix ? scope.item[scope.fieldprefix][scope.field] :
                        scope.item[scope.field];

                    if (previousLocator && scope.selectedTerm === previousLocator.city) {
                        loc = previousLocator;
                    } else {
                        loc = {city: scope.selectedTerm, city_code: scope.selectedTerm, tz: 'UTC',
                            dateline: 'city', country: '', country_code: '', state_code: '', state: ''};
                    }
                }

                if (loc) {
                    if (angular.isDefined(scope.fieldprefix)) {
                        if (!angular.isDefined(scope.item[scope.fieldprefix])) {
                            _.extend(scope.item, {dateline: {}});
                        }
                        updates[scope.fieldprefix] = scope.item[scope.fieldprefix];
                        updates[scope.fieldprefix][scope.field] = loc;
                    } else {
                        updates[scope.field] = loc;
                    }

                    scope.selectedTerm = loc.city;
                    _.extend(scope.item, updates);
                }

                var selectedLocator = {item: scope.item, city: scope.selectedTerm};

                scope.postprocessing(selectedLocator);
                scope.change(selectedLocator);
            };
        },
    };
}

MetadataService.$inject = ['api', 'subscribersService', 'config', 'vocabularies', '$rootScope', 'session', '$filter'];
function MetadataService(api, subscribersService, config, vocabularies, $rootScope, session, $filter) {
    var service = {
        values: {},
        helper_text: {},
        popup_width: {},
        single_value: {},
        cvs: [],
        search_cvs: config.search_cvs || [
            {id: 'subject', name: 'Subject', field: 'subject', list: 'subjectcodes'},
            {id: 'companycodes', name: 'Company Codes', field: 'company_codes', list: 'company_codes'},
        ],
        search_config: config.search || {
            slugline: 1, headline: 1, unique_name: 1, story_text: 1, byline: 1,
            keywords: 1, creator: 1, from_desk: 1, to_desk: 1, spike: 1,
            scheduled: 1, company_codes: 1, ingest_provider: 1, marked_desks: 1,
            featuremedia: 1,
        },
        subjectScope: null,
        loaded: null,
        _urgencyByValue: {},
        _priorityByValue: {},
        fetchMetadataValues: function() {
            var self = this;

            return vocabularies.getAllActiveVocabularies().then((result) => {
                _.each(result, (vocabulary) => {
                    self.values[vocabulary._id] = vocabulary.items;
                    if (_.has(vocabulary, 'helper_text')) {
                        self.helper_text[vocabulary._id] = vocabulary.helper_text;
                    }
                    if (_.has(vocabulary, 'popup_width')) {
                        self.popup_width[vocabulary._id] = vocabulary.popup_width;
                    }
                    if (_.has(vocabulary, 'selection_type')) {
                        self.single_value[vocabulary._id] = vocabulary.selection_type === SINGLE_SELECTION;
                    }
                });
                self.cvs = result;
                self.values.regions = _.sortBy(self.values.geographical_restrictions,
                    (target) => target.value && target.value.toLowerCase() === 'all' ? '' : target.name
                );
                self.values.subscriberTypes = _.sortBy(self.values.subscriber_types,
                    (target) => target.value && target.value.toLowerCase() === 'all' ? '' : target.name
                );

                if (self.values.urgency) {
                    self._urgencyByValue = _.keyBy(self.values.urgency, 'qcode');
                }

                if (self.values.priority) {
                    self._priorityByValue = _.keyBy(self.values.priority, 'qcode');
                }
            });
        },
        fetchSubscribers: function() {
            var self = this;

            self.values.customSubscribers = [];
            return subscribersService.fetchTargetableSubscribers().then((items) => {
                _.each(items, (item) => {
                    self.values.customSubscribers.push({_id: item._id, name: item.name});
                });
            });
        },
        fetchSubjectcodes: function(code) {
            var self = this;

            return api.get('/subjectcodes').then((result) => {
                self.values.subjectcodes = result._items;
            });
        },
        fetchAuthors: function(code) {
            var self = this;

            self.values.authors = [];

            return api.getAll('users', {is_author: 1}).then((users) => {
                var first;

                _.each(users, (user) => {
                    var authorMetadata = {_id: user._id, name: user.display_name, user: user};

                    if (session.identity.is_author && user._id === session.identity._id) {
                        // we want logged user to appear first
                        first = authorMetadata;
                    } else {
                        self.values.authors.push(authorMetadata);
                    }
                    _.each(self.values.author_roles, (role) => {
                        self.values.authors.push({
                            _id: [user._id, role.qcode],
                            role: role.qcode,
                            name: role.name,
                            parent: user._id,
                            sub_label: user.display_name});
                    });
                });
                self.values.authors = $filter('sortByName')(self.values.authors);
                if (first) {
                    self.values.authors.unshift(first);
                }
            });
        },
        removeSubjectTerm: function(term) {
            if (!this.subjectScope) {
                return;
            }

            var self = this,
                tempItem = {};

            angular.forEach(this.search_cvs || [], (cv) => {
                if (_.isNil(term)) { // clear subject scope
                    self.subjectScope.item[cv.id].length = 0;
                } else {
                    var subjectCodesArray = self.subjectScope.item[cv.id],
                        filteredArray = _.without(subjectCodesArray, term);

                    if (filteredArray.length === subjectCodesArray.length) {
                        _.remove(filteredArray, {name: term});
                    }
                    tempItem[cv.id] = filteredArray;
                }
            });

            _.extend(self.subjectScope.item, tempItem);
            self.subjectScope.change({item: self.subjectScope.item});
        },
        fetchCities: function() {
            var self = this;

            return api.get('/cities').then((result) => {
                self.values.cities = result._items;
            });
        },
        fetchAgendas: function() {
            var self = this;

            if ($rootScope.features.agenda) {
                return api.get('/agenda').then((result) => {
                    var agendas = [];

                    _.each(result._items, (item) => {
                        if (item.is_enabled) {
                            agendas.push({name: item.name, id: item._id, qcode: item.name});
                        }
                    });
                    self.values.agendas = agendas;
                });
            }
        },
        getFilteredCustomVocabularies: function(qcodes) {
            return this.fetchMetadataValues().then(() => this.cvs.filter((cv) => {
                var cvService = cv.service || {};

                if (cvService.all) {
                    cv.terms = (cv.items || []).filter((item) => {
                        if (item.service) {
                            return qcodes.some((qcode) => !!item.service[qcode]);
                        } else {
                            return true;
                        }
                    });
                    return true;
                } else {
                    cv.terms = cv.items;
                    return qcodes.length === 0 || qcodes.some((qcode) => !!cvService[qcode]);
                }
            }));
        },
        getCustomVocabulariesForArticleHeader: function(qcodes, editor, schema) {
            return this.getFilteredCustomVocabularies(qcodes)
                .then(
                    (cvs) => cvs.filter((cv) => cv.items && cv.items.length && (editor[cv._id] || schema[cv._id]))
                );
        },
        initialize: function() {
            if (!this.loaded) {
                this.loaded = this.fetchMetadataValues()
                    .then(angular.bind(this, this.fetchSubjectcodes))
                    .then(angular.bind(this, this.fetchAuthors))
                    .then(angular.bind(this, this.fetchSubscribers))
                    .then(angular.bind(this, this.fetchCities))
                    .then(angular.bind(this, this.fetchAgendas));
            }

            return this.loaded;
        },
        urgencyByValue: function(value) {
            return this._urgencyByValue[value] || null;
        },
        priorityByValue: function(value) {
            return this._priorityByValue[value] || null;
        },
    };

    $rootScope.$on('subscriber:create', () => service.fetchSubscribers());
    $rootScope.$on('subscriber:update', () => service.fetchSubscribers());

    // add new cvs to the list when created
    $rootScope.$on('vocabularies:created', (event, data) => {
        api.find('vocabularies', data.vocabulary_id).then((cv) => {
            service.cvs = service.cvs.concat([cv]);
        });
    });

    // update cv on change
    $rootScope.$on('vocabularies:updated', (event, data) => {
        api.find('vocabularies', data.vocabulary_id).then((cv) => {
            service.cvs = service.cvs.map((_cv) => _cv._id === cv._id ? cv : _cv);
        });
    });

    return service;
}

angular.module('superdesk.apps.authoring.metadata', [
    'superdesk.apps.authoring.widgets',
    'superdesk.apps.publish',
    'vs-repeat',
])
    .config(['authoringWidgetsProvider', function(authoringWidgetsProvider) {
        authoringWidgetsProvider
            .widget('metadata', {
                icon: 'info',
                label: gettext('Info'),
                removeHeader: true,
                template: 'scripts/apps/authoring/metadata/views/metadata-widget.html',
                order: 1,
                side: 'right',
                display: {
                    authoring: true,
                    packages: true,
                    killedItem: true,
                    legalArchive: true,
                    archived: true,
                    picture: true,
                    personal: true,
                },
            });
    }])

    .controller('MetadataWidgetCtrl', MetadataCtrl)
    .service('metadata', MetadataService)
    .directive('sdMetaTarget', MetaTargetedPublishingDirective)
    .directive('sdMetaTerms', MetaTermsDirective)
    .directive('sdMetaTags', MetaTagsDirective)
    .directive('sdMetaDropdown', MetaDropdownDirective)
    .directive('sdMetaWordsList', MetaWordsListDirective)
    .directive('sdMetadropdownFocus', MetadropdownFocusDirective)
    .directive('sdMetaLocators', MetaLocatorsDirective)
    .directive('sdPreferedCvItemsConfig', PreferedCvItemsConfigDirective)
    .directive('sdMetaPlace', MetaPlaceDirective)
;
