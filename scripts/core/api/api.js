/**
 * @ngdoc module
 * @module superdesk.core.api
 * @name superdesk.core.api
 * @packageName superdesk.core
 * @description Superdesk core API utilities.
 */
angular.module('superdesk.core.api', [
    'superdesk.core.api.http',
    'superdesk.core.api.service',
    'superdesk.core.api.request',
    'superdesk.core.api.urls',
    'superdesk.core.api.timeout',
    'superdesk.core.api.allowed',
])

    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push('timeoutInterceptor');
    }]);
