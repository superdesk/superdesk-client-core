import ng from 'core/services/ng';

beforeEach(window.module(($provide) => $provide.constant('lodash', window._)));
beforeEach(window.module('superdesk.mocks'));
beforeEach(window.module('superdesk.core.auth.session'));
beforeEach(window.module('superdesk.core.services.storage'));

/**
 * Mock services that call server on init and thus would require mocking all the time
 */
angular.module('superdesk.mocks', [])
    .config(['$qProvider', ($qProvider) => $qProvider.errorOnUnhandledRejections(false)])
    .run(['$injector', ng.register])
    .constant('config', {
        server: {url: ''},
        editor: {},
        model: {
            dateformat: 'DD/MM/YYYY',
            timeformat: 'HH:mm:ss',
        },
        iframely: {key: ''},
        validatorMediaMetadata: {
            headline: {
                required: true,
            },
            alt_text: {
                required: true,
            },
            description_text: {
                required: true,
            },
            copyrightholder: {
                required: false,
            },
            byline: {
                required: false,
            },
            usageterms: {
                required: false,
            },
            copyrightnotice: {
                required: false,
            },
        },
    })
    .service('features', () => { /* no-op */ })
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
