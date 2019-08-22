/**
 * @ngdoc service
 * @module superdesk.core.auth
 * @name auth
 * @description auth-service handles the authentication by sending crendentials
 * to backend endpoints.
 */

angular.module('superdesk.core.auth.auth', []).service('auth', ['api', 'session', 'authAdapter',
    function(api, session, authAdapter) {
        /**
         * @ngdoc method
         * @name auth#login
         * @param {string} username User's login
         * @param {string} password Users's password
         * @returns {Promise} If successful, session identity is returned
         * @description authenticate user using database auth
         */
        this.login = function(username, password) {
            return authAdapter.authenticate(username, password)
                .then((sessionData) => api.users.getById(sessionData.user)
                    .then((userData) => {
                        session.start(sessionData, userData);
                        return session.identity;
                    }),
                );
        };
        this.loginOIDC = function(authorization_code) {
            return authAdapter.authenticateOIDC(authorization_code)
                .then((sessionData) => api.users.getById(sessionData.user)
                    .then((userData) => {
                        session.start(sessionData, userData);
                        return session.identity;
                    }),
                );
        };

        /**
         * @ngdoc method
         * @name auth#loginOAuth
         * @param {Object} data
         * @return {Promise}
         */
        this.loginOAuth = function(response) {
            authAdapter.setToken(response);
            return api.users.getById(response.data.user)
                .then((userData) => {
                    session.start(response.data, userData);
                    return session.identity;
                });
        };

        /**
         * @ngdoc method
         * @name auth#loginXMPP
         * @param {string} jid XMPP identified (Jabber ID)
         * @param {string} transactionId ID which will be sent to the device, to check transaction
         * @returns {Promise} If successful, session identity is returned
         * @description authenticate user using XMPP auth (aka secure login)
         */
        this.loginXMPP = function(jid, transactionId) {
            return authAdapter.authenticateXMPP(jid, transactionId)
                .then((sessionData) => api.users.getById(sessionData.user)
                    .then((userData) => {
                        session.start(sessionData, userData);
                        return session.identity;
                    }),
                );
        };
    }]);
