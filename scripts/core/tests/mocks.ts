import ng from 'core/services/ng';

beforeEach(window.module(($provide) => {
    $provide.constant('lodash', window._);

    localStorage.clear();
}));

beforeEach(window.module('superdesk.mocks'));
beforeEach(window.module('superdesk.core.auth.session'));
beforeEach(window.module('superdesk.core.services.storage'));

// required for react authoring fields
beforeEach(window.module('superdesk.core.preferences'));
beforeEach(window.module('superdesk.apps.spellcheck'));

beforeEach(() => {
    // mock fetch to avoid making real requests
    window.fetch = (...args) => {
        return new Promise((resolve, reject) => {
            // avoid resolving the promise
            // so the code that calls fetch will stop
        });
    };
});

/**
 * Mock services that call server on init and thus would require mocking all the time
 */
angular.module('superdesk.mocks', [])
    .config(['$qProvider', ($qProvider) => $qProvider.errorOnUnhandledRejections(false)])
    .run(['$httpBackend', ($httpBackend) => {
        // mock call to api home which is used in a few service factories
        $httpBackend.whenGET('http://localhost:5000').respond({_links: {child: [
            {title: 'auth_db', href: 'auth_db'},
            {title: 'users', href: 'users'},
            {title: 'preferences', href: 'preferences'},
            {title: 'workspace', href: '/users/<regex():user_id>/workspace'},
        ]}});

        // editor3 is fetching those
        $httpBackend.whenGET('http://localhost:5000/languages').respond({_items: [
            {_id: 'en', label: 'English', language: 'en'},
        ]});

        $httpBackend.whenGET('http://localhost:5000/content_types').respond({_items: []});

        $httpBackend.whenGET('http://localhost:5000/ingest_rule_handlers').respond({_items: []});

        $httpBackend.whenGET('http://localhost:5000/preferences/sess').respond({});
    }])
    .run(['$injector', ($injector) => {
        ng.register($injector);
    }])
    .constant('config', {
        server: {url: 'http://localhost:5000'},
        editor: {},
        model: {
            dateformat: 'DD/MM/YYYY',
            timeformat: 'HH:mm:ss',
        },
        iframely: {key: ''},
        profileLanguages: ['en', 'de_DE'],
    })
    .service('features', () => { /* no-op */ })
    .service('preferencesService', function($q) {
        this.mock = true;

        this.get = function() {
            return $q.when(null);
        };

        this.getSync = function() {
            return {};
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

