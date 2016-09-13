MetadataCtrl.$inject = [
    '$scope', 'desks', 'metadata', '$filter', 'privileges', 'datetimeHelper',
    'preferencesService', 'archiveService', 'config', 'moment', 'content'
];
function MetadataCtrl(
    $scope, desks, metadata, $filter, privileges, datetimeHelper,
    preferencesService, archiveService, config, moment, content) {

    desks.initialize()
    .then(function() {
        $scope.deskLookup = desks.deskLookup;
        $scope.userLookup = desks.userLookup;
    });

    $scope.change_profile = config.item_profile && config.item_profile.change_profile === 1;

    metadata.initialize().then(function() {
        $scope.metadata = metadata.values;
        return preferencesService.get();
    })
    .then(setAvailableCategories)
    .then(setAvailableCompanyCodes);

    content.getTypes().then(function() {
        $scope.content_types = content.types;
    });

    $scope.processGenre = function() {
        $scope.item.genre = _.map($scope.item.genre, function(g) {
            return _.pick(g, 'name');
        });
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
        var all,        // all available categories
            assigned = {},   // category codes already assigned to the article
            filtered,
            itemCategories,  // existing categories assigned to the article

            // user's category preference settings , i.e. a map
            // object (<category_code> --> true/false)
            userPrefs;

        all = metadata.values.categories || [];
        userPrefs = prefs['categories:preferred'].selected;

        // gather article's existing category codes
        itemCategories = $scope.item.anpa_category || [];

        itemCategories.forEach(function (cat) {
            assigned[cat.qcode] = true;
        });

        filtered = _.filter(all, function (cat) {
            return !assigned[cat.qcode] && (_.isEmpty(userPrefs) || userPrefs[cat.qcode]);
        });

        $scope.availableCategories = _.sortBy(filtered, 'name');
    }

    /**
    * Builds a list of company_codes available for selection in scope. Used by
    * the "company_codes" menu in the Authoring metadata section.
    *
    * @function setAvailableCompanyCodes
    */
    function setAvailableCompanyCodes() {
        var all,        // all available company codes
            assigned = {},   // company codes already assigned to the article
            filtered,
            itemCompanyCodes;  // existing company codes assigned to the article

        all =  _.cloneDeep(metadata.values.company_codes || []);

        all.forEach(function (companyCode) {
            companyCode.name = companyCode.name + ' (' + companyCode.qcode + ')';
        });

        // gather article's existing company codes
        itemCompanyCodes = $scope.item.company_codes || [];

        itemCompanyCodes.forEach(function (companyCode) {
            assigned[companyCode.qcode] = true;
        });

        filtered = _.filter(all, function (companyCode) {
            return !assigned[companyCode.qcode];
        });

        $scope.availableCompanyCodes = _.sortBy(filtered, 'name');
    }

    $scope.$watch('item.publish_schedule_date', function(newValue, oldValue) {
        setPublishScheduleDate(newValue, oldValue);
    });

    $scope.$watch('item.publish_schedule_time', function(newValue, oldValue) {
        setPublishScheduleDate(newValue, oldValue);
    });

    $scope.$watch('item.time_zone', function(newValue, oldValue) {
        if ((newValue || oldValue) && (newValue !== oldValue)) {
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
        if ((newValue || oldValue) && (newValue !== oldValue)) {
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

    $scope.$watch('item.embargo_date', function(newValue, oldValue) {
        //set embargo time default on initial date selection
        if (newValue && oldValue === undefined) {
            $scope.item.embargo_time = moment('00:01', 'HH:mm')
                .format(config.model.timeformat);
        }

        setEmbargoTS(newValue, oldValue);
    });

    $scope.$watch('item.embargo_time', function(newValue, oldValue) {
        setEmbargoTS(newValue, oldValue);
    });

    /**
     * Listener method which gets invoked when either Embargo Date or Embargo Time has changed. This function takes
     * values of both Embargo Date and Embargo Time to form Timestamp.
     */
    function setEmbargoTS(newValue, oldValue) {
        if ((newValue || oldValue) && (newValue !== oldValue)) {
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
        var publish_schedule = datetimeHelper.removeTZ($scope.item.publish_schedule);

        if ($scope.item.schedule_settings) {
            $scope.item.time_zone = $scope.item.schedule_settings.time_zone;
            if ($scope.item.schedule_settings.utc_embargo) {
                embargo = $scope.item.schedule_settings.utc_embargo;
            }

            if ($scope.item.schedule_settings.utc_publish_schedule) {
                publish_schedule = $scope.item.schedule_settings.utc_publish_schedule;
            }
        }

        if (embargo) {
            info = datetimeHelper.splitDateTime(embargo, $scope.item.time_zone);
            $scope.item.embargo_date = info.date;
            $scope.item.embargo_time = info.time;
        }

        if (publish_schedule) {
            info = datetimeHelper.splitDateTime(publish_schedule, $scope.item.time_zone);
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
            autosave: '&'
        },
        templateUrl: 'scripts/superdesk-authoring/metadata/views/metadata-target-publishing.html',
        link: function(scope, elem) {

            scope.removeTarget = function(target) {
                scope.targets = _.without(scope.targets, target);
                scope.autosave();
            };

            scope.addTarget = function(target) {
                if (angular.isUndefined(scope.targets)) {
                    scope.targets = [];
                }

                target = JSON.parse(target);

                var existing = _.find(scope.targets,
                    {'qcode': target.qcode, 'name': target.name, 'allow': !scope.deny});

                if (!existing) {
                    scope.targets.push({'qcode': target.qcode, 'name': target.name, 'allow': !scope.deny});
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
        }
    };
}

MetadropdownFocusDirective.$inject = ['keyboardManager'];
function MetadropdownFocusDirective(keyboardManager) {
    return {
        require: 'dropdown',
        link: function(scope, elem, attrs, dropdown) {
            scope.$watch(dropdown.isOpen, function(isOpen) {
                if (isOpen) {
                    _.defer(function() {
                            var keyboardOptions = {inputDisabled: false};
                            // narrow the selection to consider only dropdown list's button items
                            var buttonList = elem.find('.dropdown-menu button');

                            if (buttonList.length > 0) {
                                buttonList[0].focus();
                            }

                            keyboardManager.push('up', function () {
                                if (buttonList.length > 0) {
                                    var focusedElem = elem.find('button:focus')[0];
                                    var indexValue = _.findIndex(buttonList, function(chr) {
                                        return chr === focusedElem;
                                    });
                                    // select previous item on key UP
                                    if (indexValue > 0 && indexValue < buttonList.length) {
                                        buttonList[indexValue - 1].focus();
                                    }
                                }
                            }, keyboardOptions);

                            keyboardManager.push('down', function () {
                                if (buttonList.length > 0) {
                                    var focusedElem = elem.find('button:focus')[0];
                                    var indexValue = _.findIndex(buttonList, function(chr) {
                                        return chr === focusedElem;
                                    });
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
        }
    };
}

MetaDropdownDirective.$inject = ['$filter', 'keyboardManager'];
function MetaDropdownDirective($filter, keyboardManager) {
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
            tabindex: '='
        },
        templateUrl: 'scripts/superdesk-authoring/metadata/views/metadata-dropdown.html',
        link: function(scope, elem) {
            scope.select = function(item) {
                var o = {};

                if (item) {
                    o[scope.field] = scope.key ? item[scope.key] : [item];
                } else {
                    o[scope.field] = null;
                }

                _.extend(scope.item, o);
                scope.change({item: scope.item, field: scope.field});

                //retain focus on same dropdown control after selection.
                _.defer (function() {
                    elem.find('.dropdown-toggle').focus();
                });

                if (scope.values) {
                    scope.selected = scope.values[o[scope.field]] || null;
                }
            };

            scope.$watch(':: list', function() {
                scope.values = _.keyBy(scope.list, 'qcode');
            });

            scope.$applyAsync(function() {
                if (scope.list) {
                    if (scope.field === 'place') {
                        scope.places = _.groupBy(scope.list, 'group');
                    } else if (scope.field === 'genre') {
                        scope.list = $filter('sortByName')(scope.list);
                    }
                }
            });
        }
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
            disabled: '='
        },
        templateUrl: 'scripts/superdesk-authoring/metadata/views/metadata-tags.html',
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

            scope.$watch('adding', function() {
                if (scope.adding) {
                    $timeout(function() {
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
                    .replace(/<\/?[^>]+>/gi, '').trim()
                    .replace(/&nbsp;/g, ' ');
                if (body) {
                    api.save('keywords', {text: body})
                        .then(function(result) {
                            scope.extractedTags = _.map(result.keywords, 'text');
                            scope.tags = _.uniq(scope.extractedTags.concat(scope.item[scope.field]));
                            scope.refreshing = false;
                        });
                } else {
                    scope.refreshing = false;
                }
            };

            scope.refresh();
        }
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
            header: '@'
        },
        templateUrl: 'scripts/superdesk-authoring/metadata/views/metadata-words-list.html',
        link: function(scope, element) {
            scope.words = [];
            scope.selectedTerm = '';

            scope.$applyAsync(function() {
                element.find('input, select').addClass('line-input');

                if (scope.list) {
                    scope.words = scope.list;
                }
            });

            /**
             * sdTypeahead directive invokes this method and is responsible for searching word(s) where the word.name
             * matches word_to_find.
             *
             * @return {Array} list of word(s)
             */
            scope.search = function(word_to_find) {
                if (!word_to_find) {
                    scope.words = scope.list;
                } else {
                    scope.words = _.filter(scope.list, function (t) {
                        return ((t.name.toLowerCase().indexOf(word_to_find.toLowerCase()) !== -1));
                    });
                }

                scope.selectedTerm = word_to_find;
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
                var index = _.findIndex(t, function (word) {
                    return word.toLowerCase() === keyword.toLowerCase();
                });

                if (index < 0) {
                    t.push(keyword.toUpperCase());

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

                //build object
                var o = {};
                o[scope.field] = temp;

                _.extend(scope.item, o);

                scope.change({item: scope.item});
            };
        }
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
 *
 */
MetaTermsDirective.$inject = ['metadata', '$filter', '$timeout'];
function MetaTermsDirective(metadata, $filter, $timeout) {
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
            setLanguage: '@'
        },
        templateUrl: 'scripts/superdesk-authoring/metadata/views/metadata-terms.html',
        link: function(scope, elem, attrs) {
            metadata.subjectScope = scope;
            var reloadList = scope.reloadList === 'true' ? true : false;
            var includeParent = scope.includeParent === 'true' ? true : false;
            var searchUnique = scope.searchUnique === 'true' ? true : false;
            scope.combinedList = [];

            scope.tree = {};
            scope.termPath = [];

            scope.$watch('unique', function(value) {
                scope.uniqueField = value || 'qcode';
            });

            scope.$watch('list', function(items) {
                if (!items || items.length === 0) {
                    return;
                }

                var tree = {}, updates = {};
                if (scope.cv && scope.cv.dependent) {
                    updates[scope.field] = [];
                }

                angular.forEach(items, function(item) {
                    var parent = item.parent || null;
                    if (!tree.hasOwnProperty(parent)) {
                        tree[parent] = [item];
                    } else {
                        tree[parent].push(item);
                    }

                    // checks for dependent dropdowns to remain selected items if new list has them (not to reset)
                    angular.forEach(scope.item[scope.field], function(selectedItem) {
                        if (scope.cv && scope.cv.dependent) {
                            if (selectedItem.scheme === scope.cv._id){
                                if (item.name === selectedItem.name){
                                    updates[scope.field].push(selectedItem);
                                }
                            // this is for subject (which is not dependent)
                            } else if (updates[scope.field].indexOf(selectedItem) === -1){
                                updates[scope.field].push(selectedItem);
                            }
                        }
                    });
                });

                _.extend(scope.item, updates);

                scope.terms = filterSelected(items);
                scope.tree = tree;
                scope.activeTree = tree[null];
                scope.combinedList = _.union(scope.list, scope.item[scope.field] ? scope.item[scope.field] : []);
            });

            scope.$watch('item[field]', function(selected) {
                if (!selected) {
                    scope.selectedItems = [];
                    return;
                }

                scope.terms = filterSelected(scope.list);
                if (scope.cv) { // filter out items from current cv
                    scope.selectedItems = _.filter(selected, function(term) {
                        return term.scheme === (scope.cv._id || scope.cv.id);
                    });
                } else {
                    scope.selectedItems = selected;
                }
            });

            scope.$on('$destroy', function() {
                metadata.subjectScope = null;
            });

            scope.openParent = function(term, $event) {
                var parent = _.find(scope.list, {qcode: term.parent});
                scope.openTree(parent, $event);
            };

            scope.openTree = function(term, $event) {
                scope.activeTerm = term;
                scope.termPath.push(term);
                scope.activeTree = scope.tree[term ? term.qcode : null];
                $event.stopPropagation();
                _.defer(function () {
                    elem.find('button:not([disabled]):not(.dropdown-toggle)')[0].focus();
                });
            };

            scope.activeList = false;
            scope.selectedTerm = '';

            scope.searchTerms = function(term) {
                if (!term) {
                    scope.terms = filterSelected(scope.list);
                    scope.activeList = false;
                } else {
                    var searchList = reloadList? scope.list : scope.combinedList;
                    scope.terms = $filter('sortByName')(_.filter(filterSelected(searchList), function(t) {
                        var searchObj = {};
                        searchObj[scope.uniqueField] = t[scope.uniqueField];
                        if (searchUnique) {
                            return (((t.name.toLowerCase().indexOf(term.toLowerCase()) !== -1) ||
                                    (t[scope.uniqueField].toLowerCase().indexOf(term.toLowerCase()) !== -1)) &&
                                !_.find(scope.item[scope.field], searchObj));
                        } else {
                            return ((t.name.toLowerCase().indexOf(term.toLowerCase()) !== -1) &&
                                !_.find(scope.item[scope.field], searchObj));
                        }
                    }));
                    scope.activeList = true;
                }
                return scope.terms;
            };

            function filterSelected(terms) {
                var selected = {};
                angular.forEach(scope.item[scope.field], function(term) {
                    if (term) {
                        selected[term[scope.uniqueField]] = 1;
                    }
                });

                return _.filter(terms, function(term) {
                    return term && !selected[term[scope.uniqueField]];
                });
            }

            function addTerm(term) {
                if (!term) {
                    return;
                }

                let isSelected = filterSelected([term]).length === 0;

                // Only select terms that are not already selected
                if (!isSelected) {
                    //instead of simple push, extend the item[field] in order to trigger dirty $watch
                    var t = [];

                    if (!term.single_value) {
                        t = _.clone(scope.item[scope.field]) || [];
                    }

                    if (scope.cv && scope.cv.single_value) {
                        t = _.filter(t, function(term) {
                            return term.scheme !== scope.cv._id;
                        });
                    }

                    //build object
                    var o = {};

                    if (term.language && scope.setLanguage) {
                        o.language = term.language;
                    }

                    t.push(angular.extend({}, term, {
                        scheme: scope.cv ? scope.cv._id : null
                    }));

                    o[scope.field] = t;
                    _.extend(scope.item, o);
                }
            }

            scope.selectTerm = function(term) {
                if (term) {
                    addTerm(term);

                    if (includeParent) {
                        scope.termPath.forEach(function(term) {
                            addTerm(term);
                        });
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

                    $timeout(function() {
                        scope.$applyAsync(function () {
                            scope.postprocessing();
                            scope.change({item: scope.item, field: scope.field});
                        });
                    }, 50, false);

                    //retain focus and initialise activeTree on same dropdown control after selection.
                    _.defer (function() {
                        if (!_.isEmpty(elem.find('.dropdown-toggle'))) {
                            elem.find('.dropdown-toggle').focus();
                        }
                        if (reloadList) {
                            scope.activeTerm = null;
                            scope.searchTerms(null);
                            scope.activeTree = scope.tree[null];
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
                    scope.activeTree.push(term);
                    scope.activeTree = $filter('sortByName')(scope.activeTree);
                    scope.allSelected = false;
                }

                scope.terms = $filter('sortByName')(scope.terms);
                scope.change({item: scope.item, field: scope.field});
                elem.find('.dropdown-toggle').focus(); // retain focus
            };

        }
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
            tabindex: '='
        },

        templateUrl: 'scripts/superdesk-authoring/metadata/views/metadata-locators.html',
        link: function(scope, element) {
            scope.selectedTerm = '';
            scope.locators = [];

            scope.$applyAsync(function() {
                if (scope.item) {
                    if (scope.fieldprefix && scope.item[scope.fieldprefix] && scope.item[scope.fieldprefix][scope.field]) {
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
            scope.$watch('item[fieldprefix][field].city || item[field].city', function(located) {
                scope.selectedTerm = located;
            });

            /**
             * sdTypeahead directive invokes this method and is responsible for searching located object(s) where the
             * city name matches locator_to_find.
             *
             * @return {Array} list of located object(s)
             */
            scope.searchLocator = function(locator_to_find) {
                if (!locator_to_find) {
                    setLocators(scope.list);
                } else {
                    setLocators(_.filter(scope.list, function(t) {
                        return ((t.city.toLowerCase().indexOf(locator_to_find.toLowerCase()) !== -1));
                    }));
                }

                scope.selectedTerm = locator_to_find;
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

                if (!locator && scope.selectedTerm) {
                    var previousLocator = scope.fieldprefix ? scope.item[scope.fieldprefix][scope.field] :
                                            scope.item[scope.field];

                    if (previousLocator && scope.selectedTerm === previousLocator.city) {
                        locator = previousLocator;
                    } else {
                        locator = {'city': scope.selectedTerm, 'city_code': scope.selectedTerm, 'tz': 'UTC',
                            'dateline': 'city', 'country': '', 'country_code': '', 'state_code': '', 'state': ''};
                    }
                }

                if (locator) {
                    if (angular.isDefined(scope.fieldprefix)) {
                        if (!angular.isDefined(scope.item[scope.fieldprefix]))
                        {
                            _.extend(scope.item, {dateline: {}});
                        }
                        updates[scope.fieldprefix] = scope.item[scope.fieldprefix];
                        updates[scope.fieldprefix][scope.field] = locator;
                    } else {
                        updates[scope.field] = locator;
                    }

                    scope.selectedTerm = locator.city;
                    _.extend(scope.item, updates);
                }

                var selectedLocator = {item: scope.item, city: scope.selectedTerm};

                scope.postprocessing(selectedLocator);
                scope.change(selectedLocator);
            };
        }
    };
}

MetadataService.$inject = ['api', '$q', 'subscribersService', 'config'];
function MetadataService(api, $q, subscribersService, config) {
    var service = {
        values: {},
        cvs: [],
        search_cvs: config.search_cvs || [{'id': 'subject', 'name': 'Subject', 'field': 'subject', 'list': 'subjectcodes'},
                     {'id': 'companycodes', 'name': 'Company Codes', 'field': 'company_codes', 'list': 'company_codes'}],
        search_config: config.search || {'slugline': 1, 'headline': 1, 'unique_name': 1, 'story_text': 1,
            'byline': 1, 'keywords': 1, 'creator': 1, 'from_desk': 1, 'to_desk': 1, 'spike': 1, 'scheduled': 1, 'company_codes': 1,
            'ingest_provider': 1},
        subjectScope: null,
        loaded: null,
        _urgencyByValue: {},
        _priorityByValue: {},
        fetchMetadataValues: function() {
            var self = this;
            return api.query('vocabularies', {max_results: 50}).then(function(result) {
                _.each(result._items, function(vocabulary) {
                    self.values[vocabulary._id] = vocabulary.items;
                });
                self.cvs = result._items;
                self.values.regions = _.sortBy(self.values.geographical_restrictions, function(target) {
                        return target.value && target.value.toLowerCase() === 'all' ? '' : target.name;
                    }
                );
                self.values.subscriberTypes = _.sortBy(self.values.subscriber_types, function(target) {
                        return target.value && target.value.toLowerCase() === 'all' ? '' : target.name;
                    }
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
            return subscribersService.fetchTargetableSubscribers().then(function(items) {
                _.each(items, function(item) {
                    self.values.customSubscribers.push({'_id': item._id, 'name': item.name});
                });
            });
        },
        fetchSubjectcodes: function(code) {
            var self = this;
            return api.get('/subjectcodes').then(function(result) {
                self.values.subjectcodes = result._items;
            });
        },
        removeSubjectTerm: function(term) {
            if (!this.subjectScope) {
                return;
            }

            var self = this,
                tempItem = {};

            angular.forEach(this.search_cvs || [], function(cv) {
                if (term == null) { // clear subject scope
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
            return api.get('/cities').then(function(result) {
                self.values.cities = result._items;
            });
        },
        filterCvs: function(qcodes, cvs) {
            var self = this;
            self.cvs.forEach(function(cv) {
                var cvService = cv.service || {};
                var match = false;

                if (cvService.all) {
                    match = true;
                    cv.terms = self.filterByService(cv.items, qcodes);
                } else {
                    qcodes.forEach(function(qcode) {
                        match = match || cvService[qcode];
                    });
                    cv.terms = cv.items;
                }

                if (match) {
                    cvs.push(cv);
                }
            });
        },
        filterByService: function(items, qcodes) {
            return _.filter(items, function(item) {
                var match = false;
                if (item.service) {
                    qcodes.forEach(function(qcode) {
                        match = match || item.service[qcode];
                    });
                } else {
                    match = true;
                }
                return match;
            });
        },
        initialize: function() {
            if (!this.loaded) {
                this.loaded = this.fetchMetadataValues()
                    .then(angular.bind(this, this.fetchSubjectcodes))
                    .then(angular.bind(this, this.fetchSubscribers))
                    .then(angular.bind(this, this.fetchCities));
            }

            return this.loaded;
        },
        urgencyByValue: function(value) {
            return this._urgencyByValue[value] || null;
        },
        priorityByValue: function(value) {
            return this._priorityByValue[value] || null;
        }
    };

    return service;
}

angular.module('superdesk.authoring.metadata', ['superdesk.authoring.widgets', 'superdesk.publish', 'vs-repeat'])
    .config(['authoringWidgetsProvider', function(authoringWidgetsProvider) {
        authoringWidgetsProvider
            .widget('metadata', {
                icon: 'info',
                label: gettext('Info'),
                removeHeader: true,
                template: 'scripts/superdesk-authoring/metadata/views/metadata-widget.html',
                order: 1,
                side: 'right',
                display: {authoring: true, packages: true, killedItem: true, legalArchive: true, archived: true}
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
    .directive('sdMetaLocators', MetaLocatorsDirective);
