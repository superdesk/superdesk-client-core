import 'app.scss'; // styles
import 'vendor';
import 'core';
import 'templates-cache.generated'; // generated by grunt 'ngtemplates' task
import 'apps';
import 'external-apps';
import {appConfig} from 'appConfig';
import {IConfigurableUiComponents} from 'superdesk-api';
import {CC} from 'core/ui/configurable-ui-components';

if (appConfig.features.useTansaProofing) {
    // tslint:disable-next-line:no-var-requires
    require('apps/tansa');
}

let body = angular.element('body');

function initializeConfigDefaults(config) {
    const sunday = '0';

    return {
        ...config,
        startingDay: config.startingDay != null ? config.startingDay : sunday,
    };
}

let started = false;

export function startApp(
    customUiComponents: IConfigurableUiComponents,
) {
    if (started === true) {
        return;
    }

    started = true;

    for (const key in customUiComponents) {
        CC[key] = customUiComponents[key];
    }

    // update config via config.js
    if (window.superdeskConfig) {
        angular.merge(appConfig, window.superdeskConfig);
    }

    // non-mock app configuration must live here to allow tests to override
    // since tests do not import this file.
    angular.module('superdesk.config').constant('config', initializeConfigDefaults(appConfig));

    /**
     * @ngdoc module
     * @name superdesk-client
     * @packageName superdesk-client
     * @description The root superdesk module.
     */
    angular.bootstrap(body, [
        'superdesk.config',
        'superdesk.core',
        'superdesk.apps',
    ].concat(appConfig.apps || []), {strictDi: true});

    window['superdeskIsReady'] = true;
}

setTimeout(() => {
    if (started !== true) {
        startApp({});
    }
}, 500);
