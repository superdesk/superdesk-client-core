angular.module('superdesk.api', [
    'superdesk.api.http',
    'superdesk.api.service',
    'superdesk.api.request',
    'superdesk.api.urls',
    'superdesk.api.timeout',
    'superdesk.api.allowed'
])

    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push('timeoutInterceptor');
    }]);
