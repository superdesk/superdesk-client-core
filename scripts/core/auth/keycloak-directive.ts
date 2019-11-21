import Keycloak from 'keycloak-js';

/*
 * Keycloak modal is watching session identity, redirect to login screen
 * and call logout when session is cleared
 */
angular.module('superdesk.core.auth.keycloak', []).directive('sdKeycloakModal', [
    'session',
    'auth',
    'deployConfig',
    function(session, auth, deployConfig) {
        return {
            link: function(scope, $element) {
                const init = function() {
                    deployConfig.all({ oidc: 'oidc_auth' }).then((methods) => {
                        return methods.oidc;
                    }).then((enable) => {
                        if (!enable) {
                            return;
                        }
                        deployConfig.all({
                            keycloak: 'keycloak_config',
                        }).then((configs) => {
                            scope.keycloak = Keycloak(configs.keycloak);
                            scope.keycloak.configs = configs.keycloak;
                        }).then(() => {
                            scope.keycloak.init({
                                onLoad: 'login-required',
                            }).success(() => {
                                auth.loginOIDC(scope.keycloak.token);
                            });
                        });
                    });
                };
                init();

                scope.$watch(() => session.identity, () => {
                    if (session.identity == null && (scope.keycloak || {}).authenticated) {
                        scope.keycloak.logout();
                    }
                });
            },
        };
    },
]);
