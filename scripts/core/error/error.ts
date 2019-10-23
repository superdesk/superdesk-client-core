import Raven from 'raven-js';
import {appConfig} from 'appConfig';

ErrorHttpInterceptorFactory.$inject = ['$q'];
function ErrorHttpInterceptorFactory($q) {
    return {
        responseError: function responseError(rejection) {
            if (rejection.status >= 500 && rejection.status < 600) {
                Raven.captureException(new Error('HTTP response error'), {
                    tags: {component: 'server'},
                    extra: {
                        status: rejection.status,
                        request: rejection.config,
                        response: rejection.data,
                    },
                });
            }
            return $q.reject(rejection);
        },
    };
}

/**
 * @ngdoc module
 * @module superdesk.core.error
 * @name superdesk.core.error
 * @packageName superdesk.core
 * @description Superdesk error reporting module.
 */
angular.module('superdesk.core.error', [])
    .config(['$httpProvider', '$provide', function($httpProvider, $provide) {
        if (appConfig.raven?.dsn) {
            Raven.config(appConfig.raven.dsn, {
                logger: 'javascript-client',
                release: appConfig.version,
            }).install();

            $httpProvider.interceptors.push(ErrorHttpInterceptorFactory);

            $provide.factory('$exceptionHandler', () => function errorCatcherHandler(exception, cause) {
                Raven.captureException(exception, {tags: {component: 'ui'}, extra: exception});
            });
        }
    }]);
