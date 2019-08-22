/**
 * @ngdoc service
 * @module superdesk.core.auth
 * @name authAdapter
 * @description auth-service handles the authentication by sending crendentials
 * to backend endpoints.
 */

angular.module('superdesk.core.auth.basic', [])
    .service('authAdapter', ['$http', 'urls', function($http, urls) {
        /**
         * Set token using response object
         *
         * @param {Object} response
         * @return {Object} response.data
         */
        this.setToken = (response) => {
            response.data.token = formatToken(response.data.token);
            $http.defaults.headers.common.Authorization = response.data.token;
            return response.data;
        };

        /**
         * @ngdoc method
         * @name authAdapter#authenticate
         * @param {string} username User's login
         * @param {string} password Users's password
         * @returns {Promise} If successful, session data is returned, including session token
         * @description authenticate user using database auth
         */
        this.authenticate = (username, password) => urls.resource('auth_db')
            .then((url) => $http.post(url, {username: username, password: password}))
            .then(this.setToken);

                /**
         * @ngdoc method
         * @name authAdapter#authenticate
         * @param {string} authorization_code Authorization code return from keycloak
         * @returns {Promise} If successful, session data is returned, including session token
         * @description authenticate user using oidc auth
         */
        this.authenticateOIDC = (authorization_code) => urls.resource('oidcauth')
            .then((url) => $http.post(url, {}, {headers: {Authorization: formatTokenBearer(authorization_code)}}))
            .then(this.setToken);

        /**
         * @ngdoc method
         * @name authAdapter#authenticateXMPP
         * @param {string} jid XMPP identified (Jabber ID)
         * @param {string} transactionId ID which will be sent to the device, to check transaction
         * @returns {Promise} If successful, session data is returned, including session token
         * @description authenticate user using XMPP auth (aka secure login)
         */
        this.authenticateXMPP = (jid, transactionId) => urls.resource('auth_xmpp')
            .then((url) => $http.post(url, {jid: jid, transactionId: transactionId}))
            .then(this.setToken);

        /**
         * Format token for basic auth
         *
         * @param {string} token
         * @return {string}
         */
        function formatToken(token) {
            return token.startsWith('Basic') ? token : 'Basic ' + btoa(token + ':');
        }

        function formatTokenBearer(token) {
            return token.startsWith('Bearer') ? token : 'Bearer ' + token;
        }
    }]);
