import _ from 'lodash';

import 'core/global-fixes';

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
import 'core/form';

import ng from 'core/services/ng';

import {reactToAngular1} from 'superdesk-ui-framework';

import {extensions} from 'core/extension-imports.generated';
import {getSuperdeskApiImplementation} from './get-superdesk-api-implementation';
import { CollapseBox } from './ui/components/CollapseBox';
import { ExtensionPage } from './extension-page';

/* globals __SUPERDESK_CONFIG__: true */
const appConfig = __SUPERDESK_CONFIG__;

// This module gets overwritten when building for production to create template
// cache. For more information, see the `grunt ngtemplates:core` task.
angular.module('superdesk.templates-cache', []);

let core = angular.module('superdesk.core', [
    'ngRoute',
    'ngResource',
    'ngFileUpload',

    'superdesk-ui',

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
    'superdesk.core.form',

    'superdesk.core.services',
    'superdesk.core.directives',

    'superdesk.templates-cache',
]);

core.constant('lodash', _);

core.component('sdExtensionPage', reactToAngular1(ExtensionPage, []));
core.config(['$routeProvider', ($routeProvider) => {
    $routeProvider.when('/', {
        redirectTo: appConfig.defaultRoute,
    });

    for (const extensionId in extensions) {
        const {extension} = extensions[extensionId];

        if (extension.contribute != null && extension.contribute.pages != null) {
            extension.contribute.pages.forEach((page) => {
                $routeProvider.when(page.url, {
                    controller: angular.noop,
                    template: '<sd-extension-page></<sd-extension-page>',
                });
            });
        }
    }

}]);

// due to angular 1.6
core.config(['$locationProvider', ($locationProvider) => $locationProvider.hashPrefix('')]);
core.config(['$qProvider', ($qProvider) => $qProvider.errorOnUnhandledRejections(true)]);
core.config(['$compileProvider', ($compileProvider) => $compileProvider.preAssignBindingsEnabled(true)]);

core.run(['$injector', ng.register]);
core.run(['$document', ($document) => {
    if (window.navigator.userAgent.toLowerCase().includes('firefox')) {
        // workaround for firefox drag event not reporting mouse coordinates
        $document.on('dragover', (event) => {
            window.dragPageY = event.pageY;
        });
    }
}]);

core.run(['superdesk', 'modal', (superdesk, modal) => {
    for (const extensionId in extensions) {
        const extensionObject = extensions[extensionId];

        const superdeskApi = getSuperdeskApiImplementation(extensionId, extensions, modal);

        extensionObject.apiInstance = superdeskApi;

        extensionObject.extension.activate(superdeskApi);
    }
}]);

export default core;
