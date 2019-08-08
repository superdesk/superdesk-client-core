/* eslint-disable max-len */
/* tslint:disable:max-line-length */
import {gettext} from 'core/utils';
import {copyJson} from 'core/helpers/utils';

/**
 * @ngdoc directive
 * @module superdesk.apps.users
 * @name sdUserPreferences
 * @description
 *   This directive creates the Preferences tab on the user profile
 *   panel, allowing users to set various system preferences for
 *   themselves.
 */
UserPreferencesDirective.$inject = ['session', 'preferencesService', 'notify', 'asset',
    'metadata', 'desks', 'modal', '$timeout', '$q', 'userList', 'lodash', 'config', 'search'];

export function UserPreferencesDirective(
    session, preferencesService, notify, asset, metadata, desks, modal,
    $timeout, $q, userList, _, config, search,
) {
    // human readable labels for server values
    const LABELS = {
        mgrid: gettext('Grid View'),
        compact: gettext('List View'),
        photogrid: gettext('Photo Grid View'),
        list: gettext('List View'),
        swimlane: gettext('Swimlane View'),
    };

    const ICONS = {
        mgrid: 'grid-view',
        compact: 'list-view',
        photogrid: 'grid-view',
        list: 'list-view',
        swimlane: 'kanban-view',
    };

    return {
        templateUrl: asset.templateUrl('apps/users/views/user-preferences.html'),
        link: function(scope, element, attrs) {
            /*
             * Set this to true after adding all the preferences to the scope. If done before, then the
             * directives which depend on scope variables might fail to load properly.
             */
            scope.preferencesLoaded = false;
            var orig; // original preferences, before any changes

            preferencesService.get(null, true).then((result) => {
                orig = result;
                buildPreferences(orig);

                scope.datelineSource = session.identity.dateline_source;
                scope.datelinePreview = scope.preferences['dateline:located'].located;
            });

            scope.cancel = function() {
                scope.userPrefs.$setPristine();
                buildPreferences(orig);

                scope.datelinePreview = scope.preferences['dateline:located'].located;
            };

            userList.getUser(scope.user._id, true).then((u) => {
                scope.user = u;
            });

            /**
            * Saves the preferences changes on the server. It also
            * invokes additional checks beforehand, namely the
            * preferred categories selection.
            *
            * @method save
            */
            scope.save = function() {
                preSaveCategoriesCheck()
                    .then(() => {
                        var update = createPatchObject();

                        return preferencesService.update(update).then(() => {
                            userList.getUser(scope.user._id, true).then((u) => {
                                scope.user = u;
                            });
                            return update;
                        });
                    }, () => $q.reject('canceledByModal'))
                    .then((preferences) => {
                    // ask for browser permission if desktop notification is enable
                        if (_.get(preferences, 'desktop:notification.enabled')) {
                            preferencesService.desktopNotification.requestPermission();
                        }
                        notify.success(gettext('User preferences saved'));
                        scope.cancel();
                    }, (reason) => {
                        if (reason !== 'canceledByModal') {
                            notify.error(gettext(
                                'User preferences could not be saved...',
                            ));
                        }
                    });
            };

            /**
             * Invoked by the directive after updating the property in item. This method is responsible for updating
             * the properties dependent on dateline.
             */
            scope.changeDatelinePreview = function(datelinePreference, city) {
                if (city === '') {
                    datelinePreference.located = null;
                }

                $timeout(() => {
                    scope.datelinePreview = datelinePreference.located;
                });
            };

            /**
            * Marks all categories in the preferred categories list
            * as selected.
            *
            * @method checkAll
            */
            scope.checkAll = function() {
                scope.categories.forEach((cat) => {
                    cat.selected = true;
                });
                scope.userPrefs.$setDirty();
            };

            /**
            * Marks all categories in the preferred categories list
            * as *not* selected.
            *
            * @method checkNone
            */
            scope.checkNone = function() {
                scope.categories.forEach((cat) => {
                    cat.selected = false;
                });
                scope.userPrefs.$setDirty();
            };

            /**
            * Marks the categories in the preferred categories list
            * that are considered default as selected, and all the
            * other categories as *not* selected.
            *
            * @method checkDefault
            */
            scope.checkDefault = function() {
                scope.categories.forEach((cat) => {
                    cat.selected = !!scope.defaultCategories[cat.qcode];
                });
                scope.userPrefs.$setDirty();
            };

            /**
             * Sets the form as dirty when value is changed. This function should be used when one wants to set
             * form dirty for input controls created without using <input>.
             *
             * @method articleDefaultsChanged
             */
            scope.articleDefaultsChanged = function(item) {
                scope.userPrefs.$setDirty();
            };

            scope.showCategory = function(preference) {
                if (preference.category === 'rows') {
                    return _.get(config, 'list.singleLineView');
                }
                const noShowCategories = [
                    'article_defaults',
                    'categories',
                    'desks',
                    'notifications',
                    'planning',
                    'cvs',
                ];

                return _.indexOf(noShowCategories, preference.category) < 0;
            };

            scope.profileConfig = _.get(config, 'profile', {});

            /**
             * Determine if the planning related preferences should be shown based on the existance of the
             * Agenda endpoint.
             *
             * @method showPlanning
             */
            scope.showPlanning = function() {
                return !angular.isUndefined(scope.features.agenda);
            };

            scope.valueLabel = (value) => LABELS[value] || value;

            scope.getIcon = (value) => ICONS[value] || 'list-view';

            /**
            * Builds a user preferences object in scope from the given
            * data.
            *
            * @function buildPreferences
            * @param {Object} data - user preferences data, arranged in
            *   logical groups. The keys represent these groups' names,
            *   while the corresponding values are objects containing
            *   user preferences settings for a particular group.
            */
            function buildPreferences(data) {
                var buckets, // names of the needed metadata buckets
                    initNeeded; // metadata service init needed?

                scope.preferences = {};
                _.each(data, (val, key) => {
                    if (val.label && val.category) {
                        scope.preferences[key] = copyJson(val);
                    }
                });

                // metadata service initialization is needed if its
                // values object is undefined or any of the needed
                // data buckets are missing in it
                buckets = [
                    'categories',
                    'default_categories',
                    'locators',
                    'calendars',
                    'agendas',
                    'eventsPlanningFilters',
                ];

                initNeeded = buckets.some((bucketName) => {
                    var values = metadata.values || {};

                    return angular.isUndefined(values[bucketName]);
                });

                if (initNeeded) {
                    var initPromises = [];

                    initPromises.push(metadata.initialize(), desks.initialize());
                    $q.all(initPromises).then(() => {
                        updateScopeData(metadata.values, data);
                    });
                } else {
                    updateScopeData(metadata.values, data);
                }
            }

            /**
            * Updates auxiliary scope data, such as the lists of
            * available and content categories to choose from.
            *
            * @function updateScopeData
            * @param {Object} helperData - auxiliary data used by the
            *   preferences settings UI
            * @param {Object} userPrefs - user's personal preferences
            *   settings
            */
            function updateScopeData(helperData, userPrefs) {
                // If the planning module is installed we save a list of the available agendas
                if (scope.features.agenda) {
                    scope.agendas = helperData.agendas;
                }

                // If the planning module is installed we save a list of the available events_planning_filters
                if (scope.features.events_planning_filters) {
                    scope.eventsPlanningFilters = helperData.eventsPlanningFilters;
                }

                // A list of category codes that are considered
                // preferred by default, unless of course the user
                // changes this preference setting.
                scope.defaultCategories = {};
                helperData.default_categories.forEach((cat) => {
                    scope.defaultCategories[cat.qcode] = true;
                });

                // Create a list of categories for the UI widgets to
                // work on. New category objects are created so that
                // objects in the existing category list are protected
                // from modifications on ng-model changes.
                scope.categories = [];
                helperData.categories.forEach((cat) => {
                    var newObj = copyJson(cat),
                        selectedCats = userPrefs['categories:preferred'].selected;

                    newObj.selected = !!selectedCats[cat.qcode];
                    scope.categories.push(newObj);
                });

                /**
                 * @ngdoc property
                 * @name sdUserPreferences#desks
                 * @type {array}
                 * @private
                 * @description Create a list of desks for the UI widgets to
                 * work on. New desk objects are created so that
                 * objects in the existing desk list are protected
                 * from modifications on ng-model changes.
                 */
                scope.desks = [];
                _.each(desks.deskLookup, (desk) => {
                    var newObj = copyJson(desk),
                        selectedDesks = userPrefs['desks:preferred'].selected;

                    newObj.selected = !!selectedDesks[desk._id];
                    scope.desks.push(newObj);
                });

                scope.locators = helperData.locators;

                if (scope.preferences['singleline:view']) {
                    search.updateSingleLineStatus(scope.preferences['singleline:view'].enabled);
                }

                scope.calendars = helperData.event_calendars;

                scope.preferencesLoaded = true;
            }

            /**
            * Checks if at least one preferred category has been
            * selected, and if not, asks the user whether or not to
            * proceed with a default set of categories selected.
            *
            * Returns a promise that is resolved if saving the
            * preferences should continue, and rejected if it should be
            * aborted (e.g. when no categories are selected AND the
            * user does not confirm using a default set of categories).
            *
            * @function preSaveCategoriesCheck
            * @return {Object} - a promise object
            */
            function preSaveCategoriesCheck() {
                var modalResult,
                    msg,
                    someSelected;

                someSelected = scope.categories.some((cat) => cat.selected);

                if (someSelected) {
                    // all good, simply return a promise that resolves
                    return $q.when();
                }

                msg = gettext('No preferred categories selected. Should you choose to proceed with your choice. A default set of categories will be selected for you.');

                modalResult = modal.confirm(msg).then(() => {
                    scope.checkDefault();
                });

                return modalResult;
            }

            /**
            * Creates and returns a user preferences object that can
            * be used as a parameter in a PATCH request to the server
            * when user preferences are saved.
            *
            * @function createPatchObject
            * @return {Object}
            */
            function createPatchObject() {
                var p = {};

                _.each(orig, (val, key) => {
                    if (key === 'dateline:located') {
                        var $input = element.find('.input-term > input');

                        scope.changeDatelinePreview(scope.preferences[key], $input[0].value);
                    }

                    if (key === 'categories:preferred') {
                        val.selected = {};
                        scope.categories.forEach((cat) => {
                            val.selected[cat.qcode] = !!cat.selected;
                        });
                    }

                    if (key === 'desks:preferred') {
                        val.selected = {};
                        scope.desks.forEach((desk) => {
                            val.selected[desk._id] = !!desk.selected;
                        });
                    }

                    p[key] = _.extend(val, scope.preferences[key]);
                });
                return p;
            }
        },
    };
}
