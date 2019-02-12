import _ from 'lodash';
import {gettext} from 'core/ui/components/utils';

/**
 * Login modal is watching session token and displays modal when needed
 */
angular.module('superdesk.core.auth.login', []).directive('sdLoginModal', [
    'session',
    'auth',
    'features',
    'config',
    'deployConfig',
    'usersService',
    'notify',
    '$route',
    function(session, auth, features, config, deployConfig, usersService, notify, $route) {
        return {
            replace: true,
            templateUrl: 'scripts/core/auth/login-modal.html',
            link: function(scope, element, attrs) {
                scope.features = features;
                scope.changePassword = false;

                deployConfig.all({
                    xmpp: 'xmpp_auth',
                    saml: 'saml_auth',
                    google: 'google_auth',
                }).then((methods) => {
                    scope.methods = methods;
                });

                deployConfig.all({
                    saml: 'saml_label',
                }).then((labels) => {
                    scope.labels = labels;
                });

                scope.authenticate = function() {
                    scope.isLoading = true;
                    scope.loginError = null;
                    auth.login(scope.username || '', scope.password || '')
                        .then(() => {
                            scope.isLoading = false;
                            scope.password = null;
                            reloadRoute();
                        }, (rejection) => {
                            scope.isLoading = false;

                            if (rejection.data._issues.password_is_expired) {
                                scope.changePassword = true;
                                scope.oldPassword = scope.password;
                                scope.password = null;
                                scope.passwordConfirm = null;
                            }

                            scope.loginError = rejection.status;
                            if (scope.loginError === 401) {
                                scope.password = null;
                            }
                        });
                };

                scope.changeUserPassword = function() {
                    scope.isLoading = true;

                    usersService.changePassword(scope.username, scope.oldPassword, scope.password)
                        .then(() => {
                            scope.isLoading = false;
                            scope.changePassword = false;
                            scope.password = null;
                            scope.loginError = null;
                            notify.success(gettext('The password has been changed.'), 3000);
                        }, (response) => {
                            scope.isLoading = false;
                            scope.changePassword = null;
                            scope.passwordConfirm = null;
                            notify.success(gettext('Failed to change the password.'), 3000);
                        });
                };

                scope.openLoginPopup = function(service) {
                    window.open(apiUrl + '/login/' + service);
                };

                const apiUrl = _.get(config, 'server.url', '')
                    .replace('api/', 'api'); // make sure there is no trailing /
                const handleAuthMessage = (event) => {
                    if (event.origin === apiUrl.replace('/api', '') && event.data.type === 'oauth') {
                        const message = event.data;

                        if (message.data.token) {
                            auth.loginOAuth(message);
                            reloadRoute();
                        } else {
                            scope.$apply(() => {
                                scope.loginError = message.data.error;
                            });
                        }
                    }

                    return false;
                };

                window.addEventListener('message', handleAuthMessage);

                scope.$on('$destroy', () => {
                    window.removeEventListener('message', handleAuthMessage);
                });

                function reloadRoute() {
                    if ($route.current && $route.current.redirectTo) {
                        $route.reload();
                    }
                }

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
            },
        };
    }]);
