angular.module('superdesk.core.auth.auth', []).service('auth', ['$q', 'api', 'session', 'authAdapter',
    function($q, api, session, authAdapter) {
    /**
     * Login using given credentials
     *
     * @param {string} username
     * @param {string} password
     * @returns {object} promise
     */
        this.login = function(username, password) {
            function fetchIdentity(loginData) {
                return api.users.getById(loginData.user);
            }

            return authAdapter.authenticate(username, password)
            .then((sessionData) => fetchIdentity(sessionData)
                    .then((userData) => {
                        session.start(sessionData, userData);
                        return session.identity;
                    }));
        };
    }]);
