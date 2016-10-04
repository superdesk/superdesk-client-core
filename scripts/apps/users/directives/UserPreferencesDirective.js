/**
 * @memberof superdesk.users
 * @ngdoc directive
 * @name sdUserPreferences
 * @description
 *   This directive creates the Preferences tab on the user profile
 *   panel, allowing users to set various system preferences for
 *   themselves.
 */
UserPreferencesDirective.$inject = ['api', 'session', 'preferencesService', 'notify', 'asset',
    'metadata', 'modal', '$timeout', '$q', 'userList', 'lodash'];

export function UserPreferencesDirective(
    api, session, preferencesService, notify, asset, metadata, modal,
    $timeout, $q, userList, _
) {
    return {
        templateUrl: asset.templateUrl('apps/users/views/user-preferences.html'),
        link: function(scope, element, attrs) {
            /*
             * Set this to true after adding all the preferences to the scope. If done before, then the
             * directives which depend on scope variables might fail to load properly.
             */
            scope.preferencesLoaded = false;
            var orig;  // original preferences, before any changes

            preferencesService.get(null, true).then(function(result) {
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

            userList.getUser(scope.user._id, true).then(function(u) {
                scope.user = u;
            });

            /**
            * Saves the preferences changes on the server. It also
            * invokes additional checks beforehand, namely the
            * preferred categories selection.
            *
            * @method save
            */
            scope.save = function () {
                preSaveCategoriesCheck()
                .then(function () {
                    var update = createPatchObject();
                    return preferencesService.update(update).then(function() {
                        userList.getUser(scope.user._id, true).then(function(u) {
                            scope.user = u;
                        });
                    });
                }, function () {
                    return $q.reject('canceledByModal');
                })
                .then(function () {
                    notify.success(gettext('User preferences saved'));
                    scope.cancel();
                }, function (reason) {
                    if (reason !== 'canceledByModal') {
                        notify.error(gettext(
                            'User preferences could not be saved...'
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

                $timeout(function () {
                    scope.datelinePreview = datelinePreference.located;
                });
            };

            /**
            * Marks all categories in the preferred categories list
            * as selected.
            *
            * @method checkAll
            */
            scope.checkAll = function () {
                scope.categories.forEach(function (cat) {
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
            scope.checkNone = function () {
                scope.categories.forEach(function (cat) {
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
            scope.checkDefault = function () {
                scope.categories.forEach(function (cat) {
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
                var buckets,  // names of the needed metadata buckets
                    initNeeded;  // metadata service init needed?

                scope.preferences = {};
                _.each(data, function(val, key) {
                    if (val.label && val.category) {
                        scope.preferences[key] = _.create(val);
                    }
                });

                // metadata service initialization is needed if its
                // values object is undefined or any of the needed
                // data buckets are missing in it
                buckets = [
                    'cities', 'categories', 'default_categories', 'locators'
                ];

                initNeeded = buckets.some(function (bucketName) {
                    var values = metadata.values || {};
                    return angular.isUndefined(values[bucketName]);
                });

                if (initNeeded) {
                    metadata.initialize().then(function () {
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
                scope.cities = helperData.cities;

                // A list of category codes that are considered
                // preferred by default, unless of course the user
                // changes this preference setting.
                scope.defaultCategories = {};
                helperData.default_categories.forEach(function (cat) {
                    scope.defaultCategories[cat.qcode] = true;
                });

                // Create a list of categories for the UI widgets to
                // work on. New category objects are created so that
                // objects in the existing category list are protected
                // from modifications on ng-model changes.
                scope.categories = [];
                helperData.categories.forEach(function (cat) {
                    var newObj = _.create(cat),
                        selectedCats = userPrefs['categories:preferred'].selected;
                    newObj.selected = !!selectedCats[cat.qcode];
                    scope.categories.push(newObj);
                });

                scope.locators = helperData.locators;
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

                someSelected = scope.categories.some(function (cat) {
                    return cat.selected;
                });

                if (someSelected) {
                    // all good, simply return a promise that resolves
                    return $q.when();
                }

                msg = [
                    'No preferred categories selected. Should you ',
                    'choose to proceed with your choice, a default ',
                    'set of categories will be selected for you.'
                ].join('');
                msg = gettext(msg);

                modalResult = modal.confirm(msg).then(function () {
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

                _.each(orig, function(val, key) {
                    if (key === 'dateline:located') {
                        var $input = element.find('.input-term > input');
                        scope.changeDatelinePreview(scope.preferences[key], $input[0].value);
                    }

                    if (key === 'categories:preferred') {
                        val.selected = {};
                        scope.categories.forEach(function (cat) {
                            val.selected[cat.qcode] = !!cat.selected;
                        });
                    }

                    p[key] = _.extend(val, scope.preferences[key]);
                });
                return p;
            }
        }
    };
}
