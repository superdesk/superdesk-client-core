import 'core/activity';
import 'core/analytics';
import 'core/api';
import 'core/auth';
import 'core/beta';
import 'core/datetime';
import 'core/error';
import 'core/elastic';
import 'core/filters';
import 'core/services';
import 'core/directives';
import 'core/editor2';
import 'core/spellcheck';
import 'core/editor3';
import 'core/features';
import 'core/list';
import 'core/keyboard';
import 'core/privileges';
import 'core/notification';
import 'core/itemList';
import 'core/menu';
import 'core/notify';
import 'core/ui';
import 'core/upload';
import 'core/lang';
import 'core/config';
import 'core/loading';

import ng from 'core/services/ng';

/* globals __SUPERDESK_CONFIG__: true */
const appConfig = __SUPERDESK_CONFIG__;

// This module gets overwritten when building for production to create template
// cache. For more information, see the `grunt ngtemplates:core` task.
angular.module('superdesk.templates-cache', []);

let core = angular.module('superdesk.core', [
    'ngRoute',
    'ngResource',
    'ngFileUpload',

    'ui.bootstrap',

    'superdesk.core.activity',
    'superdesk.core.analytics',
    'superdesk.core.api',
    'superdesk.core.auth',
    'superdesk.core.datetime',
    'superdesk.core.elastic',
    'superdesk.core.error',
    'superdesk.core.notify',
    'superdesk.core.ui',
    'superdesk.core.upload',
    'superdesk.core.menu',
    'superdesk.core.filters',
    'superdesk.core.preferences',
    'superdesk.core.translate',
    'superdesk.core.workflow',
    'superdesk.core.loading',
    'superdesk.core.editor3',

    // services/
    'superdesk.core.services.beta',
    'superdesk.core.services.data',
    'superdesk.core.services.modal',
    'superdesk.core.services.dragdrop',
    'superdesk.core.services.server',
    'superdesk.core.services.entity',
    'superdesk.core.services.permissions',
    'superdesk.core.services.storage',
    'superdesk.core.services.pageTitle',

    'superdesk.core.directives',

    'superdesk.templates-cache'
]);

core.constant('lodash', _);

core.config(['$routeProvider', ($routeProvider) => {
    $routeProvider.when('/', {
        redirectTo: appConfig.defaultRoute
    });
}]);

core.run(['$injector', ng.register]);

export default core;
