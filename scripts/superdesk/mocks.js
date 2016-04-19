(function() {
'use strict';

beforeEach(module(function($provide) {
    $provide.constant('lodash', window._);
    $provide.constant('langmap', window.languageMappingList);
}));

beforeEach(module('superdesk.mocks'));
beforeEach(module('superdesk.services.storage'));

/**
 * Mock services that call server on init and thus would require mocking all the time
 */
angular.module('superdesk.preferences', []);
angular.module('superdesk.mocks', [])
    .constant('config', {
        server: {url: null},
        editor: {},
        model: {
            dateformat: 'DD/MM/YYYY',
            timeformat: 'HH:mm:ss'
        }
    })
    .service('features', function() {})
    .service('preferencesService', function($q) {
        this.mock = true;

        this.get = function() {
            return $q.when(null);
        };

        this.getActions = function() {
            return $q.when([]);
        };

        this.update = function() {
            return $q.when(null);
        };

        this.getPrivileges = function() {
            return $q.when({});
        };
    })
    .service('beta', function($q) {
        this.isBeta = function() {
            return $q.when(false);
        };
    });
})();
