import _ from 'lodash';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';

/**
 * Login modal is watching session token and displays modal when needed
 */
angular.module('superdesk.core.auth.login', []).directive('sdLoginModal', [
    'session',
    'auth',
    'keycloak',
    'features',
    'usersService',
    'notify',
    '$route',
    function(session, auth, keycloak, features, usersService, notify, $route) {
        return {
            replace: true,
            // login template can be overriden (like on superdesk-fi)
            templateUrl: 'scripts/core/auth/login-modal.html',
            link: function(scope, element, attrs) {
                scope.features = features;
                scope.changePassword = false;

                scope.methods = {
                    xmpp: appConfig.xmpp_auth,
                    saml: appConfig.saml_auth,
                    google: appConfig.google_auth,
                };

                scope.labels = {
                    saml: appConfig.saml_label,
                };
                // Keycloak auth
                if (appConfig.oidc_auth) {
                    keycloak.keycloakAuth();
                }

                scope.form = {username: '', password: '', passwordConfirm: ''};

                scope.authenticate = function() {
                    scope.isLoading = true;
                    scope.loginError = null;
                    auth.login(scope.form.username || '', scope.form.password || '')
                        .then(() => {
                            scope.isLoading = false;
                            scope.form.password = null;
                            reloadRoute();
                        }, (rejection) => {
                            scope.isLoading = false;

                            if (rejection.data._issues.password_is_expired) {
                                scope.changePassword = true;
                                scope.oldPassword = scope.form.password;
                                scope.form.password = null;
                                scope.form.passwordConfirm = null;
                            }

                            scope.loginError = rejection.status;
                            if (scope.loginError === 401) {
                                scope.form.password = null;
                            }
                        });
                };

                scope.changeUserPassword = function() {
                    scope.isLoading = true;

                    usersService.changePassword(scope.form.username, scope.oldPassword, scope.form.password)
                        .then(() => {
                            scope.isLoading = false;
                            scope.changePassword = false;
                            scope.form.password = null;
                            scope.loginError = null;
                            notify.success(gettext('The password has been changed.'), 3000);
                        }, (response) => {
                            scope.isLoading = false;
                            scope.changePassword = null;
                            scope.form.passwordConfirm = null;
                            notify.success(gettext('Failed to change the password.'), 3000);
                        });
                };

                scope.openLoginPopup = function(service) {
                    window.open(apiUrl + '/login/' + service);
                };

                const apiUrl = appConfig.server.url
                    .replace('api/', 'api'); // make sure there is no trailing /
                const handleAuthMessage = (event) => {
                    if (event.data?.type === 'oauth') {
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
                    scope.form.username = session.identity ? session.identity.UserName : null;
                    scope.form.password = null;
                    // when OIDC is enabled, user will always be redirected to Keycloak server to log in
                    // showing login screen before redirect may cause flashing
                    if (!triggerLogin[0] && triggerLogin[1] === true && !appConfig.oidc_auth) {
                        scope.active = true;
                        var focusElem = scope.form.username ? 'password' : 'username';

                        element.find('#login-' + focusElem).focus();
                    } else {
                        scope.active = false;
                    }
                });
            },
        };
    }]);
