import Keycloak from 'keycloak-js';
import {appConfig} from 'appConfig';
/*
 * Keycloak modal is watching session identity, redirect to login screen
 * and call logout when session is cleared
 */
angular.module('superdesk.core.auth.keycloak', []).directive('sdKeycloakModal', [
    'session',
    'auth',
    function(session, auth) {
        return {
            link: function(scope, $element) {
                const init = function() {
                    if (!appConfig.oidc_auth) {
                        return;
                    }
                    scope.keycloak = Keycloak(appConfig.keycloak_config);
                    scope.keycloak.configs = appConfig.keycloak_config;
                    scope.keycloak.init({
                        onLoad: 'login-required',
                    }).success(() => {
                        auth.loginOIDC(scope.keycloak.token);
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
