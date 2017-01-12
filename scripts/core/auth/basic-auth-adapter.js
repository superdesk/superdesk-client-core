/**
 * @ngdoc service
 * @module superdesk.core.auth
 * @name authAdapter
 * @description auth-service handles the authentication by sending crendentials
 * to backend endpoints.
 */

angular.module('superdesk.core.auth.basic', []).service('authAdapter', ['$http', 'urls',
    function($http, urls) {
        /**
         * @ngdoc method
         * @name authAdapter#authenticate
         * @param {string} username User's login
         * @param {string} password Users's password
         * @returns {Promise} If successful, session data is returned, including session token
         * @description authenticate user using database auth
         */
        this.authenticate = function(username, password) {
            return urls.resource('auth_db').then((url) => $http.post(url, {
                username: username,
                password: password
            }).then((response) => {
                response.data.token = 'Basic ' + btoa(response.data.token + ':');
                $http.defaults.headers.common.Authorization = response.data.token;
                return response.data;
            }));
        };


        /**
         * @ngdoc method
         * @name authAdapter#authenticateXMPP
         * @param {string} jid XMPP identified (Jabber ID)
         * @param {string} transactionId ID which will be sent to the device, to check transaction
         * @returns {Promise} If successful, session data is returned, including session token
         * @description authenticate user using XMPP auth (aka secure login)
         */
        this.authenticateXMPP = function(jid, transactionId) {
            return urls.resource('auth_xmpp').then((url) => $http.post(url, {
                jid: jid,
                transactionId: transactionId
            }).then((response) => {
                response.data.token = 'Basic ' + btoa(response.data.token + ':');
                $http.defaults.headers.common.Authorization = response.data.token;
                return response.data;
            }));
        };
    }]);
