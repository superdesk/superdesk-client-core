import Keycloak from 'keycloak-js';
import {appConfig} from 'appConfig';

/*
 * Keycloak modal is watching session identity, redirect to login screen
 * and call logout when session is cleared
 */
angular.module('superdesk.core.auth.keycloak', []).service('keycloak', [
    'session',
    'auth',
    '$rootScope',
    function(session, auth, $rootScope) {
        let keycloak = null;

        this.keycloakAuth = () => {
            keycloak = Keycloak(appConfig.keycloak_config);
            keycloak
                .init({onLoad: 'login-required'})
                .success(() => {
                    auth.loginOIDC(keycloak.token);
                });
        };

        $rootScope.$watch(
            () => session.identity,
            () => {
                if (session.identity == null && (keycloak || {}).authenticated) {
                    keycloak.logout();
                }
            },
        );
    },
]);
