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

import {ExtensionPage} from './extension-page';
import {registerExtensions} from './register-extensions';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {dashboardRoute} from 'appConfig';

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

const styles = 'display: flex; height: 100%;';

let _superdesk;

core.component('sdExtensionPage', reactToAngular1(ExtensionPage, [], [], styles));
core.config(['$routeProvider', 'superdeskProvider', ($routeProvider, superdesk) => {
    // set initial default route to personal
    // when user is logged in, it will be overwritten by a default route
    // from configs if user has permissions to that route
    $routeProvider.when('/', {
        redirectTo: '/workspace/personal',
    });

    ng.getServices(['superdesk', 'privileges']).then((res: Array<any>) => {
        const __superdesk = res[0];
        const privileges = res[1];

        const activity = __superdesk.activities[appConfig.defaultRoute];

        if (activity != null) {
            privileges.loaded.then(() => {
                if (privileges.userHasPrivileges(activity.privileges || {})) {
                    $routeProvider.when('/', {
                        redirectTo: appConfig.defaultRoute,
                    });
                }
            });
        }
    });

    // added to be able to register activities which didn't work using superdesk reference injected in `core.run`.
    _superdesk = superdesk;
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

core.run([
    'modal',
    'privileges',
    'lock',
    'session',
    'authoringWorkspace',
    'config',
    'metadata',
    (modal, privileges, lock, session, authoringWorkspace: AuthoringWorkspaceService, config, metadata) => {
        registerExtensions(
            _superdesk,
            modal,
            privileges,
            lock,
            session,
            authoringWorkspace,
            config,
            metadata,
        );
    },
]);

export default core;
