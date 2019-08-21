import Keycloak from 'keycloak-js'

angular.module('superdesk.core.auth.keycloak', []).directive('sdKeycloakModal', [
    'session',
    'auth',
    'deployConfig',
    function(session, auth, deployConfig) {
        return {
            link: function(scope, $element) {
                const init = async () => {
                    const methods = await deployConfig.all({ oidc: 'oidc_auth' })
                    const isOIDCEnabled = await methods.oidc
                    if (!isOIDCEnabled) {
                        return;
                    }

                    deployConfig.all({
                        keycloak: 'keycloak_config',
                    }).then(configs => {
                        scope.keycloak = Keycloak(configs.keycloak)
                        scope.keycloak.configs = configs.keycloak
                    }).then(() => {
                        scope.keycloak.init({
                            onLoad: 'login-required',
                        }).success(() => {
                            auth.loginOIDC(scope.keycloak.token);
                            session.keycloak = scope.keycloak;
                        })
                    })
                }
                init()

                scope.$watch(() => session.identity, () => {
                    if (session.identity == null && (scope.keycloak || {}).authenticated) {
                        scope.keycloak.logout()
                    }
                })
            }
        }
    }
])
