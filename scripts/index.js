/* globals __SUPERDESK_CONFIG__: true */
const appConfig = __SUPERDESK_CONFIG__;

import 'bootstrap.less'; // styles

import 'vendor';
import 'core';
import 'templates-cache.generated'; // generated by grunt 'ngtemplates' task
import 'apps';

if (appConfig.features.useTansaProofing) {
    require('apps/tansa');
}

angular.module('superdesk.config').constant('config', appConfig);
angular.module('superdesk').constant('lodash', _)
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/', {redirectTo: appConfig.defaultRoute || '/workspace'});
    }]);

let body = angular.element('body');
body.ready(function() {
    angular.bootstrap(body, [
        'superdesk',
        'superdesk.apps'
    ], {strictDi: true});

    window.superdeskIsReady = true;
});
