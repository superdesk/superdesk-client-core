import _ from 'lodash';

/**
 * Login modal is watching session token and displays modal when needed
 */
angular.module('superdesk.core.auth.login', []).directive('sdLoginModal', [
    'session',
    'auth',
    'features',
    'config',
    'deployConfig',
    '$route',
    function(session, auth, features, config, deployConfig, $route) {
        return {
            replace: true,
            template: require('./login-modal.html'),
            link: function(scope, element, attrs) {
                scope.features = features;

                deployConfig.all({
                    xmpp: 'xmpp_auth',
                    saml: 'saml_auth',
                    google: 'google_auth'
                }).then((methods) => {
                    scope.methods = methods;
                });

                deployConfig.all({
                    saml: 'saml_label'
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
                            scope.loginError = rejection.status;
                            if (scope.loginError === 401) {
                                scope.password = null;
                            }
                        });
                };

                scope.openLoginPopup = function(service) {
                    window.open(apiUrl + '/login/' + service);
                };

                let apiUrl = _.get(config, 'server.url', '').replace('api/', 'api'); // make sure there is no trailing /
                let handleAuthMessage = (event) => {
                    if (event.origin === apiUrl.replace('/api', '') && event.data.type === 'oauth') {
                        let message = event.data;

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
            }
        };
    }]);
