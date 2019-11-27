import Keycloak from "keycloak-js";
import { appConfig } from "appConfig";

/*
 * Keycloak modal is watching session identity, redirect to login screen
 * and call logout when session is cleared
 */
angular.module("superdesk.core.auth.keycloak", []).service("keycloak", [
  "session",
  "auth",
  "$rootScope",
  function(session, auth, $rootScope) {
    this.keycloakAuth = () => {
      $rootScope.keycloak = Keycloak(appConfig.keycloak_config);
      $rootScope.keycloak.configs = appConfig.keycloak_config;
      $rootScope.keycloak
        .init({
          onLoad: "login-required"
        })
        .success(() => {
          auth.loginOIDC($rootScope.keycloak.token);
        });
    };
    $rootScope.$watch(
      () => session.identity,
      () => {
        if (
          session.identity == null &&
          ($rootScope.keycloak || {}).authenticated
        ) {
          $rootScope.keycloak.logout();
        }
      }
    );
  }
]);
