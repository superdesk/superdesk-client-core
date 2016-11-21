/**
 * Expire session on 401 server response
 */
AuthExpiredInterceptor.$inject = ['session', '$q', '$injector', '$rootScope', 'config', 'lodash'];
function AuthExpiredInterceptor(session, $q, $injector, $rootScope, config, _) {

    function handleAuthExpired(response) {
        session.expire();
        return session.getIdentity().then(function() {
            var $http = $injector.get('$http');
            $http.defaults.headers.common.Authorization = session.token;
            response.config.headers.Authorization = session.token;
            return $injector.get('request').resend(response.config);
        });
    }

    return {
        response: function(response) {
            if (_.startsWith(response.config.url, config.server.url) && response.status === 401) {
                return handleAuthExpired(response);
            }

            return response;
        },
        responseError: function(response) {
            if (_.startsWith(response.config.url, config.server.url) && response.status === 401) {
                if (!(((response.data || {})._issues || {}).credentials)) {
                    return handleAuthExpired(response);
                }
            }

            return $q.reject(response);
        }
    };
}

angular.module('superdesk.core.auth.interceptor', ['superdesk.core.api', 'superdesk.core.auth.session'])
    .service('AuthExpiredInterceptor', AuthExpiredInterceptor);

ResetPassworController.$inject = ['$scope', '$location', 'api', 'notify', 'gettext'];
function ResetPassworController($scope, $location, api, notify, gettext) {
    $scope.isSending = false;
    $scope.isReseting = false;

    var resetForm = function() {
        $scope.email = '';
        $scope.token = '';
        $scope.password = '';
        $scope.passwordConfirm = '';
    };

    $scope.sendToken = function() {
        $scope.sendTokenError = null;
        api.resetPassword.create({email: $scope.email})
        .then(function(result) {
            notify.success(gettext('Link sent. Please check your email inbox.'));
            $scope.flowStep = 2;
        }, function(rejection) {
            $scope.sendTokenError = rejection.status;
        });
        resetForm();
    };
    $scope.resetPassword = function() {
        $scope.setPasswordError = null;
        api.resetPassword.create({token: $scope.token, password: $scope.password})
        .then(function(result) {
            notify.success(gettext('Password was changed. You can login using your new password.'));
            $location.path('/').search({});
        }, function(rejection) {
            $scope.setPasswordError = rejection.status;
        });
        resetForm();
    };

    resetForm();

    var query = $location.search();
    if (query.token) {
        api.resetPassword.create({token: query.token})
        .then(function(result) {
            $scope.token = query.token;
            $scope.flowStep = 3;
        }, function(rejection) {
            $scope.setPasswordError = rejection.status;
            $scope.flowStep = 1;
        });
    } else {
        $scope.flowStep = 1;
    }
}

angular.module('superdesk.core.auth.session', [])
    .constant('SESSION_EVENTS', {
        LOGIN: 'login',
        LOGOUT: 'logout',
        IDENTITY_LOADED: 'identity_loaded'
    });

/**
 * @ngdoc module
 * @module superdesk.core.auth
 * @name superdesk.core.auth
 * @packageName superdesk.core
 * @description Superdesk core authentication and session related functionalities.
 */
export default angular.module('superdesk.core.auth', [
    'superdesk.core.features',
    'superdesk.core.activity',
    'superdesk.core.auth.session',
    'superdesk.core.services.asset',
    'superdesk.config',
    'superdesk.core.auth.auth',
    'superdesk.core.auth.basic',
    'superdesk.core.auth.login',
    'superdesk.core.auth.interceptor'
])
    .config(['$httpProvider', 'superdeskProvider', 'assetProvider', function($httpProvider, superdesk, asset) {
        $httpProvider.interceptors.push('AuthExpiredInterceptor');

        superdesk
            .activity('/reset-password/', {
                controller: ResetPassworController,
                templateUrl: asset.templateUrl('core/auth/reset-password.html'),
                auth: false
            });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('resetPassword', {
            type: 'http',
            backend: {
                rel: 'reset_user_password'
            }
        });
        apiProvider.api('auth', {
            type: 'http',
            backend: {
                rel: 'auth'
            }
        });
    }])

    // watch session token, identity
    .run(['$rootScope', '$http', '$window', 'session', 'api', 'superdeskFlags', 'authoringWorkspace',
        'modal', 'gettext', 'SESSION_EVENTS',
        function($rootScope, $http, $window, session, api, superdeskFlags, authoringWorkspace,
            modal, gettext, SESSION_EVENTS) {
            $rootScope.logout = function() {

                function replace() {
                    session.clear();
                    $window.location.replace('/'); // reset page for new user
                }

                var canLogout = true;
                if (superdeskFlags.flags.authoring) {
                    var item = authoringWorkspace.getItem();

                    if (item && item._autosaved) {
                        canLogout = false;
                        modal.confirm(gettext('There are some unsaved changes. Please save them before signing out.'),
                        gettext('Warning'), gettext('OK'), '');
                    }
                }

                if (canLogout) {
                    api.auth.getById(session.sessionId).then(function (sessionData) {
                        api.auth.remove(sessionData).then(replace, replace);
                    });
                }
            };

        // populate current user
            $rootScope.$watch(function watchSessionIdentity() {
                return session.identity;
            }, function (identity) {
                $rootScope.currentUser = session.identity;
                $rootScope.$broadcast(SESSION_EVENTS.IDENTITY_LOADED);
            });

        // set auth header
            $rootScope.$watch(function watchSessionToken() {
                return session.token;
            }, function(token) {
                if (token) {
                    $http.defaults.headers.common.Authorization = token;
                    $rootScope.sessionId = session.sessionId;
                } else {
                    delete $http.defaults.headers.common.Authorization;
                    $rootScope.sessionId = null;
                }
            });
        }]);
