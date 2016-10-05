var modules = [
    'ngRoute',
    'ngResource',
    'ui.bootstrap',
    'ngFileUpload',
    'superdesk.activity',
    'superdesk.analytics',
    'superdesk.api',
    'superdesk.auth',
    'superdesk.services.beta',
    'superdesk.datetime',
    'superdesk.elastic',
    'superdesk.error',
    'superdesk.notify',
    'superdesk.ui',
    'superdesk.upload',
    'superdesk.menu',
    'superdesk.filters',
    // services/
    'superdesk.services.data',
    'superdesk.services.modal',
    'superdesk.services.dragdrop',
    'superdesk.services.server',
    'superdesk.services.entity',
    'superdesk.services.permissions',
    'superdesk.services.storage',
    'superdesk.preferences',
    'superdesk.translate',
    'superdesk.workflow',
    // directives/
    'superdesk.directives.autofocus',
    'superdesk.directives.throttle',
    'superdesk.directives.sort',
    'superdesk.directives.passwordStrength',
    'superdesk.links',
    'superdesk.check.directives',
    'superdesk.confirm.directives',
    'superdesk.select.directives',
    'superdesk.permissions.directives',
    'superdesk.avatar',
    'superdesk.dragdrop.directives',
    'superdesk.typeahead.directives',
    'superdesk.slider.directives',
    'superdesk.directives.searchList',
    'superdesk.directives.filetypeIcon',
    'superdesk.loading',
    'superdesk.config',
    'superdesk.templates-cache'
];

angular.module('superdesk.loading', [])

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
angular.module('superdesk', modules);
