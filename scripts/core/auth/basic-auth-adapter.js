    angular.module('superdesk.core.auth.basic', []).service('authAdapter', ['$http', 'urls',
        function($http, urls) {
        /**
         * Authenticate using given credentials
         *
         * @param {string} username
         * @param {string} password
         * @returns {object} promise
         */
            this.authenticate = function(username, password) {
                return urls.resource('auth').then((url) => $http.post(url, {
                    username: username,
                    password: password
                }).then((response) => {
                    response.data.token = 'Basic ' + btoa(response.data.token + ':');
                    $http.defaults.headers.common.Authorization = response.data.token;
                    return response.data;
                }));
            };
        }]);
