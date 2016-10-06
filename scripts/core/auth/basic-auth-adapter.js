    angular.module('superdesk.auth.basic', []).service('authAdapter', ['$http', '$q', 'urls',
    function ($http, $q, urls) {

        /**
         * Authenticate using given credentials
         *
         * @param {string} username
         * @param {string} password
         * @returns {object} promise
         */
        this.authenticate = function(username, password) {

            return urls.resource('auth').then(function(url) {
                return $http.post(url, {
                    username: username,
                    password: password
                }).then(function(response) {
                    response.data.token = 'Basic ' + btoa(response.data.token + ':');
                    $http.defaults.headers.common.Authorization = response.data.token;
                    return response.data;
                });
            });
        };
    }]);
