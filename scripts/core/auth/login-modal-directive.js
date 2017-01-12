/**
 * Login modal is watching session token and displays modal when needed
 */
angular.module('superdesk.core.auth.login', []).directive('sdLoginModal', [
    'session',
    'auth',
    'features',
    'asset',
    'api',
    '$route',
    function(session, auth, features, asset, api, $route) {
        return {
            replace: true,
            templateUrl: asset.templateUrl('core/auth/login-modal.html'),
            link: function(scope, element, attrs) {
                scope.features = features;
                scope.secureActivated = false;

                api.query('auth_xmpp_activated', {}).then(
                    (activatedData) => {
                        scope.secureActivated = activatedData.activated;
                    });

                scope.authenticate = function() {
                    scope.isLoading = true;
                    scope.loginError = null;
                    auth.login(scope.username || '', scope.password || '')
                    .then(() => {
                        scope.isLoading = false;
                        scope.password = null;
                        if ($route.current && $route.current.redirectTo) {
                            $route.reload();
                        }
                    }, (rejection) => {
                        scope.isLoading = false;
                        scope.loginError = rejection.status;
                        if (scope.loginError === 401) {
                            scope.password = null;
                        }
                    });
                };

                scope.$watchGroup([function getSessionToken() {
                    return session.token;
                }, 'requiredLogin'], function showLogin(triggerLogin) {
                    scope.isLoading = false;
                    scope.identity = session.identity;
                    scope.sessionId = session.sessionId;
                    scope.username = session.identity ? session.identity.UserName : null;
                    scope.password = null;
                    if (!triggerLogin[0] && triggerLogin[1] === true) {
                        scope.active = true;
                        var focusElem = scope.username ? 'password' : 'username';

                        element.find('#login-' + focusElem).focus();
                    } else {
                        scope.active = false;
                    }
                });
            }
        };
    }]);
