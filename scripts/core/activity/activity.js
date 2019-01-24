import langmap from 'core/lang';
import {gettext} from 'core/ui/components/utils';

var constants = {
    MENU_MAIN: 'superdesk.core.menu.main',
    MENU_SETTINGS: 'superdesk.core.menu.settings',
    ACTION_EDIT: 'edit',
    ACTION_LIST: 'list',
    ACTION_VIEW: 'view',
    ACTION_PREVIEW: 'preview',
};

export const coreMenuGroups = {
    WORKFLOW: {
        id: 'WORKFLOW',
        priority: -500,
        getLabel: (gettext) => gettext('Workflow'),
    },
    CONTENT_CONFIG: {
        id: 'CONTENT_CONFIG',
        priority: -800,
        getLabel: (gettext) => gettext('Content config'),
    },
    CONTENT_FLOW: {
        id: 'CONTENT_FLOW',
        priority: -200,
        getLabel: (gettext) => gettext('Content flow'),
    },
};

/**
 * @ngdoc provider
 * @module superdesk.core.activity
 * @name superdeskProvider
 * @requires $routeProvider
 * @requires lodash
 * @description The superdesk provider exposes an API for registering new
 * application components, such as activities, widgets, etc.
 */
SuperdeskProvider.$inject = ['$routeProvider', 'lodash'];
function SuperdeskProvider($routeProvider, _) {
    var widgets = {};
    var activities = {};
    var permissions = {};
    var panes = {};

    angular.extend(this, constants);

    /**
     * @ngdoc method
     * @name superdeskProvider#widget
     * @public
     * @param {string} id
     * @param {Object} data
     * @returns {Object} self
     * @description Register widget.
     */
    this.widget = function(id, data) {
        widgets[id] = angular.extend({_id: id, wcode: id}, data);
        return this;
    };

    /**
     * @ngdoc method
     * @name superdeskProvider#pane
     * @public
     * @description Register a pane.
     */
    this.pane = function(key, data) {
        panes[key] = angular.extend({_id: key}, data);
        return this;
    };

    /**
     * @ngdoc method
     * @name superdeskProvider#activity
     * @public
     * @param {string} id Activity ID. Can be used for later lookup.
     * @param {Object} activityData Activity definition.
     *
     *    Object properties:
     *
     *    - `priority` - `{number}` - priority used for ordering.
     *    - `when` - `{string}` - $route.when param.
     *    - `href` - `{string}` - path for links generated for given activity.
     *    - `filters` - `{Array.<Object>}` - list of `action` `type` pairs.
     *    - `beta` - `{bool=false}` - is activity available only in beta mode?
     *    - `reloadOnSearch` - `{bool=false}` - $route.reloadOnSearch param.
     *    - `auth` - `{bool=true}` - does activity require authenticated user?
     *    - `features` - `{Object}` - map of features this activity requires.
     *    - `condition` - `{Function}` - method used to check if the activity is enabled for a specific item.
     *
     * @returns {Object} self
     * @description Register a new activity.
    */
    this.activity = function(id, activityData) {
        var activity = angular.extend({
            _id: id,
            priority: 0,
            when: id, // use id as default
            href: id, // use id as default
            filters: [],
            beta: false,
            reloadOnSearch: false,
            auth: true,
            features: {},
            privileges: {},
            condition: function(item) {
                return true;
            },
        }, activityData);

        var actionless = _.find(activity.filters, (filter) => !filter.action);

        if (actionless) {
            console.error('Missing filters action for activity', activity);
        }

        if (activity.when[0] === '/' && (activity.template || activity.templateUrl)) {
            $routeProvider.when(activity.when, activity);
        }

        activities[id] = activity;
        return this;
    };

    /**
     * @ngdoc method
     * @name superdeskProvider#permission
     * @public
     *
     * @param {string} id
     * @param {Object} data
     * @returns {Object} self
     *
     * @description Register permission.
     */
    this.permission = function(id, data) {
        permissions[id] = angular.extend({_id: id}, data);
        return this;
    };

    /**
     * @ngdoc service
     * @module superdesk.core.activity
     * @name superdesk
     * @requires $q
     * @requires $route
     * @requires $rootScope
     * @requires activityService
     * @requires activityChoose
     * @requires betaService
     * @requires features
     * @requires privileges
     * @requires $injector
     * @requires lodash
     * @requires config
     * @description This service allows interacting with registered activities.
     */
    this.$get = ['$q', '$route', '$rootScope', 'activityService', 'activityChooser',
        'betaService', 'features', 'privileges', '$injector', 'lodash', 'config',
        function superdeskFactory($q, $route, $rootScope, activityService, activityChooser, betaService,
            features, privileges, $injector, _, config) {
            /**
             * Render main menu depending on registered acitivites
             */
            betaService.isBeta().then((beta) => {
                _.forEach(activities, (activity, id) => {
                    if (activity.beta === true && !beta || !isAllowed(activity, beta)) {
                        $routeProvider.when(activity.when, {redirectTo: '/workspace'});
                    }
                });
            });

            /**
             * Let user to choose an activity
             */
            function chooseActivity(activities) {
                return activityChooser.choose(activities);
            }

            function checkFeatures(activity) {
                var isMatch = true;

                angular.forEach(activity.features, (val, key) => {
                    isMatch = isMatch && features[key] && val;
                });
                return isMatch;
            }

            function checkPrivileges(activity) {
                return privileges.userHasPrivileges(activity.privileges);
            }

            function checkActivityEnabled(activity) {
                if (!_.get(config, 'activity')) {
                    return true;
                }

                if (_.isUndefined(config.activity[activity._id])) {
                    return true;
                }

                return config.activity[activity._id];
            }

            /**
             * @ngdoc method
             * @name superdesk#isAllowed
             * @private
             *
             * @param {Object} activity
             *
             * @description Test if user is allowed to use given activity.
             * Testing is based on current server setup (features) and user privileges.
             */
            function isAllowed(activity) {
                return checkActivityEnabled(activity) && checkFeatures(activity) && checkPrivileges(activity);
            }

            return angular.extend({
                widgets: widgets,
                activities: activities,
                permissions: permissions,
                panes: panes,

                /**
                 * @ngdoc method
                 * @name superdesk#activity
                 * @public
                 * @description Return activity by given id
                 */
                activity: function(id) {
                    return activities[id] || null;
                },

                /**
                 * @ngdoc method
                 * @name superdesk#resolve
                 * @public
                 * @description Resolve an intent to a single activity
                 */
                resolve: function(intent) {
                    var activities = this.findActivities(intent);

                    switch (activities.length) {
                    case 0:
                        return $q.reject();

                    case 1:
                        return $q.when(activities[0]);

                    default:
                        return chooseActivity(activities);
                    }
                },

                /**
                 * @ngdoc method
                 * @name superdesk#findActivities
                 * @public
                 * @description
                 * Find all available activities for given intent
                 */
                findActivities: function(intent, item) {
                    var criteria = {};

                    if (intent.action) {
                        criteria.action = intent.action;
                    }
                    if (intent.type) {
                        criteria.type = intent.type;
                    }
                    if (intent.id) {
                        criteria.id = intent.id;
                    }

                    return _.sortBy(_.filter(this.activities, (activity) => {
                        return _.find(activity.filters, criteria) && isAllowed(activity) &&
                            activity.condition(item) && testAdditionalCondition();

                        function testAdditionalCondition() {
                            if (activity.additionalCondition) {
                                return $injector.invoke(
                                    activity.additionalCondition,
                                    {},
                                    {item: item ? item : intent.data}
                                );
                            }

                            return true;
                        }
                    }), 'priority').reverse();
                },

                /**
                 * @ngdoc method
                 * @name superdesk#intent
                 * @param {string} action
                 * @param {string} type
                 * @param {Object} data
                 * @returns {Object} promise
                 * @public
                 * @description
                 * Starts an activity for given action and data
                 */
                intent: function(action, type, data, id) {
                    var intent = {
                        action: action,
                        type: type,
                        data: data,
                        id: id,
                    };

                    var self = this;

                    return this.resolve(intent).then((activity) => self.start(activity, intent), () => {
                        $rootScope.$broadcast([
                            'intent',
                            intent.action || '*',
                            intent.type || '*',
                        ].join(':'), intent);
                        return $q.reject();
                    });
                },

                /**
                 * @ngdoc method
                 * @name superdesk#link
                 *
                 * @param {string} activity
                 * @param {Object} data
                 * @returns {string}
                 *
                 * @description
                 * Get a link for given activity
                 */
                link: function getSuperdeskLink(activity, data) {
                    return activityService.getLink(this.activity(activity), data);
                },

                /**
                 * @ngdoc method
                 * @name superdesk#start
                 *
                 * @param {Object} activity
                 * @param {Object} locals
                 * @return {Promise}
                 *
                 * @description Start activity
                 *
                 */
                start: function(activity, locals) {
                    return activityService.start(activity, locals);
                },

                /**
                 * @ngdoc method
                 * @name superdesk#getMenu
                 *
                 * @param {string} category
                 *
                 * @description
                 * Get activities based on menu category
                 */
                getMenu: function getMenu(category) {
                    return privileges.loaded.then(() => {
                        var menu = [];

                        angular.forEach(activities, (activity) => {
                            if (activity.category === category && isAllowed(activity) &&
                                (activity.beta === false || $rootScope.beta)) {
                                menu.push(activity);
                            }
                        });

                        return menu;
                    });
                },
            }, constants);
        }];
}

/**
 * @ngdoc module
 * @module superdesk.core.activity
 * @name superdesk.core.activity
 * @packageName superdesk.core
 * @description Superdesk core activities module. Used to register new activities,
 * apps and functionalities.
 */
angular.module('superdesk.core.activity', [
    'ngRoute',
    'superdesk.core.notify',
    'superdesk.core.features',
    'superdesk.core.translate',
    'superdesk.core.services.beta',
    'superdesk.core.services.modal',
    'superdesk.core.privileges',
    'superdesk.core.keyboard',

    'superdesk.core.activity.chooser',
    'superdesk.core.activity.list',
    'superdesk.core.activity.modal',
])
    .constant('lodash', window._)
    .constant('langmap', langmap)
    .provider('superdesk', SuperdeskProvider)

/**
 * @ngdoc service
 * @module superdesk.core.activity
 * @name activityService
 * @requires $location
 * @requires $injector
 * @requires $q
 * @requires modal
 * @requires lodash
 * @description The service allows choosing activities to perform.
 */
    .service('activityService', ['$location', '$injector', '$q', 'modal', 'lodash',
        function($location, $injector, $q, modal, _) {
            var activityStack = [];

            this.activityStack = activityStack;

            /**
     * Expand path using given locals, eg. with /users/:Id and locals {Id: 2} returns /users/2
     *
     * @param {Object} activity
     * @param {Object} locals
     * @returns {string}
     */
            function getPath(activity, locals) {
                if (activity.href[0] === '/') { // trigger route
                    var matchAll = true,
                        path = activity.href.replace(/:([_a-zA-Z0-9]+)/, (match, key) => {
                            matchAll = matchAll && locals[key];
                            return locals[key] ? locals[key] : match;
                        });

                    path = matchAll ? path : null;

                    if (activity.href.indexOf('_type') !== -1 && !_.isNull(path)) {
                        path = path.replace(':_type', locals._type ? locals._type : 'archive');
                    }

                    return path;
                }
            }

            /**
     * @ngdoc method
     * @name activityService#getLink
     * @public
     *
     * @param {Object} activity
     * @param {Object} locals
     * @returns {string}
     *
     * @description
     * Get URL for given activity
     */
            this.getLink = getPath;

            /**
     * @ngdoc method
     * @name activityService#start
     * @public
     *
     * @param {object} activity
     * @param {object} locals
     * @returns {object} promise
     *
     * @description
     * Start given activity
     */
            this.start = function startActivity(activity, locals) {
                function execute(activity, locals) {
                    var path = getPath(activity, locals && locals.data);

                    if (path) { // trigger route
                        $location.path(path);
                        return $q.when(locals);
                    }

                    if (activity.modal) {
                        var defer = $q.defer();

                        activityStack.push({
                            defer: defer,
                            activity: activity,
                            locals: locals,
                        });

                        return defer.promise;
                    }

                    return $q.when($injector.invoke(activity.controller, {}, locals));
                }

                if (activity.confirm) {
                    return modal.confirm(gettext(activity.confirm)).then(function runConfirmed() {
                        return execute(activity, locals);
                    }, () => $q.reject({confirm: 1}));
                }

                return execute(activity, locals);
            };
        }])

    .run(['$rootScope', 'superdesk', function($rootScope, superdesk) {
        $rootScope.superdesk = superdesk; // add superdesk reference so we can use constants in templates

        $rootScope.intent = function() {
            return superdesk.intent(...arguments);
        };

        $rootScope.link = function() {
            var path = superdesk.link(...arguments);

            return path ? '#' + path : null;
        };
    }])

/**
 * @ngdoc service
 * @module superdesk.core.activity
 * @name activityChooser
 * @description
 * Activity chooser service - bridge between superdesk and activity chooser directive
 */
    .service('activityChooser', ['$q', function($q) {
        var defer;

        this.choose = function(activities) {
            defer = $q.defer();
            this.activities = activities;
            return defer.promise;
        };

        this.resolve = function(activity) {
            this.activities = null;
            defer.resolve(activity);
        };

        this.reject = function() {
            this.activities = null;
            defer.reject();
        };
    }])

/**
 * @ngdoc service
 * @module superdesk.core.activity
 * @name referrer
 * @description
 * Referrer service to set/get the referrer Url
 */
    .service('referrer', ['lodash', function(_) {
    /**
     * @ngdoc method
     * @name referrer#setReferrer
     * @public
     *
     * @param {Object} currentRoute
     * @param {Object} previousRoute
     * @returns {string}
     *
     * @description
     * Serving for the purpose of setting referrer url via referrer service, also
     * setting url in localStorage. which is utilized to get last working screen
     * on authoring page if referrer url is unidentified direct link
     * (i.e from notification pane)
     */
        this.setReferrer = function(currentRoute, previousRoute) {
            if (currentRoute && previousRoute) {
                if (currentRoute.$$route !== undefined && previousRoute.$$route !== undefined) {
                    if (currentRoute.$$route.originalPath === '/') {
                        this.setReferrerUrl('/workspace');
                        localStorage.setItem('referrerUrl', '/workspace');
                        sessionStorage.removeItem('previewUrl');
                    } else if (currentRoute.$$route.authoring && (!previousRoute.$$route.authoring ||
                        previousRoute.$$route._id === 'packaging')) {
                        this.setReferrerUrl(prepareUrl(previousRoute));
                        localStorage.setItem('referrerUrl', this.getReferrerUrl());
                        sessionStorage.removeItem('previewUrl');
                    }
                }
            }
        };

        var referrerURL;

        this.setReferrerUrl = function(refURL) {
            referrerURL = refURL;
        };

        this.getReferrerUrl = function() {
            if (typeof referrerURL === 'undefined' || referrerURL === null) {
                if (typeof localStorage.getItem('referrerUrl') === 'undefined'
                || localStorage.getItem('referrerUrl') === null) {
                    this.setReferrerUrl('/workspace');
                } else {
                    referrerURL = localStorage.getItem('referrerUrl');
                }
            }

            return referrerURL;
        };

        /**
     * @ngdoc method
     * @name referrer#prepareUrl
     * @private
     *
     * @param {Object} refRoute
     * @returns {string}
     *
     * @description
     * Prepares complete Referrer Url from previous route href and querystring params(if exist),
     * e.g /workspace/content?q=test$repo=archive
     */
        function prepareUrl(refRoute) {
            var completeUrl;

            if (refRoute) {
                completeUrl = refRoute.$$route.href.replace('/:_id', '');
                if (!_.isEqual({}, refRoute.pathParams)) {
                    completeUrl = completeUrl + '/' + refRoute.pathParams._id;
                }

                if (!_.isEqual({}, refRoute.params)) {
                    completeUrl = completeUrl + '?';
                    completeUrl = completeUrl + decodeURIComponent($.param(refRoute.params));
                }
            }
            return completeUrl;
        }
    }])

// reject modal on route change
// todo(petr): what about blocking route change as long as it is opened?
    .run(['$rootScope', 'activityService', 'referrer', function($rootScope, activityService, referrer) {
        $rootScope.$on('$routeChangeStart', () => {
            if (activityService.activityStack.length) {
                var item = activityService.activityStack.pop();

                item.defer.reject();
            }
        });

        $rootScope.$on('$routeChangeSuccess', (ev, currentRoute, previousRoute) => {
            referrer.setReferrer(currentRoute, previousRoute);
        });
    }])
    .directive('sdActivityItem', ActivityItemDirective)
    .directive('sdActivityDropdownItem', ActivityItemDropdownDirective);

ActivityItemDirective.$inject = ['asset'];
function ActivityItemDirective(asset) {
    return {
        templateUrl: asset.templateUrl('core/activity/views/activity-item.html'),
    };
}

ActivityItemDropdownDirective.$inject = ['asset'];
function ActivityItemDropdownDirective(asset) {
    return {
        templateUrl: asset.templateUrl('core/activity/views/activity-dropdown-item.html'),
        link: function(scope, elem, attr) {
            scope.group = attr.group;
        },
    };
}
