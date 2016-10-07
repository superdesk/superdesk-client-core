/* globals __SUPERDESK_CONFIG__: true */
const appConfig = __SUPERDESK_CONFIG__;

var modules = [
    'ngRoute',
    'ngResource',
    'ngFileUpload',

    'ui.bootstrap',

    'superdesk.core.activity',
    'superdesk.core.analytics',
    'superdesk.core.api',
    'superdesk.core.auth',
    'superdesk.core.datetime',
    'superdesk.core.elastic',
    'superdesk.core.error',
    'superdesk.core.notify',
    'superdesk.core.ui',
    'superdesk.core.upload',
    'superdesk.core.menu',
    'superdesk.core.filters',
    'superdesk.core.preferences',
    'superdesk.core.translate',
    'superdesk.core.workflow',
    'superdesk.core.loading',
    'superdesk.core.links',
    'superdesk.core.avatar',

    // services/
    'superdesk.core.services.beta',
    'superdesk.core.services.data',
    'superdesk.core.services.modal',
    'superdesk.core.services.dragdrop',
    'superdesk.core.services.server',
    'superdesk.core.services.entity',
    'superdesk.core.services.permissions',
    'superdesk.core.services.storage',

    // directives/
    'superdesk.core.directives.autofocus',
    'superdesk.core.directives.throttle',
    'superdesk.core.directives.sort',
    'superdesk.core.directives.passwordStrength',
    'superdesk.core.directives.searchList',
    'superdesk.core.directives.filetypeIcon',
    'superdesk.core.directives.check',
    'superdesk.core.directives.confirm',
    'superdesk.core.directives.select',
    'superdesk.core.directives.permissions',
    'superdesk.core.directives.dragdrop',
    'superdesk.core.directives.typeahead',
    'superdesk.core.directives.slider',

    'superdesk.templates-cache'
];

angular.module('superdesk.core.loading', [])

    // prevent routing before there is auth token
    .run(['$rootScope', '$route', '$location', '$http', 'session', 'preferencesService',
    function($rootScope, $route, $location, $http, session, preferencesService) {
        var stopListener = angular.noop;
        $rootScope.loading = true;

        // fetch preferences on load
        preferencesService.get().then(function() {
            stopListener();
            $http.defaults.headers.common.Authorization = session.token;
            $rootScope.loading = false;
            // do this in next $digest so that beta service can setup route redirects
            // for features that should not be available
            $rootScope.$applyAsync($route.reload);
        });

        // prevent routing when there is no token
        stopListener = $rootScope.$on('$locationChangeStart', function (e) {
            $rootScope.requiredLogin = requiresLogin($location.path());
            if ($rootScope.loading && $rootScope.requiredLogin) {
                e.preventDefault();
            }
        });

        /**
         * Finds out if there is a route matching given url that requires a login
         *
         * @param {string} url
         */
        function requiresLogin(url) {
            var routes = _.values($route.routes);
            for (var i = routes.length - 1; i >= 0; i--) {
                if (routes[i].regexp.test(url)) {
                    return routes[i].auth;
                }
            }
            return false;
        }
    }])

    .run(['$rootScope', 'config', function($rootScope, config) {
        $rootScope.config = config || {};
    }]);

angular.module('superdesk.config', [])
    .provider('defaultConfig', ['config', function(config) {
        /**
         * Set default config value for given key
         *
         * key can contain dots, eg. `editor.toolbar`
         *
         * @param {String} key
         * @param {String} val
         */
        this.set = function(key, val) {
            var dest = config;
            var key_pieces = key.split('.');

            for (var i = 0; i + 1 < key_pieces.length; i++) {
                var k = key_pieces[i];
                if (!dest.hasOwnProperty(k)) {
                    dest[k] = {};
                }

                dest = dest[k];
            }

            var last_key = key_pieces[key_pieces.length - 1];
            if (!dest.hasOwnProperty(last_key)) {
                dest[last_key] = val;
            }
        };

        // used only to modify config, noting to return
        this.$get = angular.noop;
    }]);

angular.module('superdesk.templates-cache', []);

angular.module('superdesk.core', modules)
    .constant('lodash', _)
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/', {redirectTo: appConfig.defaultRoute || '/workspace'});
    }]);
