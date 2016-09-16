/* globals __SUPERDESK_CONFIG__: true */
const appConfig = __SUPERDESK_CONFIG__;

var body = angular.element('body');
var apps = [
    'superdesk',
    'superdesk.settings',
    'superdesk.dashboard',
    'superdesk.users',
    'superdesk.archive',
    'superdesk.archive.directives',
    'superdesk.ingest',
    'superdesk.desks',
    'superdesk.groups',
    'superdesk.products',
    'superdesk.authoring',
    'superdesk.authoring.multiedit',
    'superdesk.packaging',
    'superdesk.editor2',
    'superdesk.editor.spellcheck',
    'superdesk.notification',
    'superdesk.highlights',
    'superdesk.content_filters',
    'superdesk.dictionaries',
    'superdesk.vocabularies',
    'superdesk.searchProviders',
    'superdesk.users.import',
    'superdesk.users.profile',
    'superdesk.users.activity',
    'superdesk.stream',
    'superdesk.publish',
    'superdesk.templates',
    'superdesk.monitoring',
    'superdesk.profiling',
    'superdesk.loading',
    'superdesk.templates-cache'
];

angular.module('superdesk.config').constant('config', appConfig);

var bootstrapModule = angular.module('superdesk-bootstrap', apps);
window.RegisterSuperdeskApplication = name => { bootstrapModule.requires.push(name); };

angular.module('superdesk')
    .constant('lodash', _)
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/', {redirectTo: appConfig.defaultRoute || '/workspace'});
    }]);

body.ready(function() {
    angular.bootstrap(body, ['superdesk-bootstrap'], {strictDi: true});
    window.superdeskIsReady = true;
});
