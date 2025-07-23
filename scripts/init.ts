/**
 * The purpose of this file is to allow the main bundle to access configs synchronously at the top level.
 * NOTE: asynchronous code must not be used here. If network requests are needed - blocking XHR must be used.
 */

import {merge} from 'lodash';
import {applyConfigurationDefaults} from 'apply-configuration-defaults';
import {ISuperdeskGlobalConfig} from 'superdesk-api';

function fetchSync(url: string, callback: (responseText: string) => void): void {
    const request = new XMLHttpRequest();

    request.addEventListener('load', function onLoad() {
        callback(this.responseText);
    });

    request.open(
        'GET',
        url,
        false, // async=false
    );

    request.send();
}

fetchSync(
    __SUPERDESK_CONFIG__.server.url + '/client_config',
    (responseText) => {
        const res = JSON.parse(responseText);

        let appConfig: ISuperdeskGlobalConfig = __SUPERDESK_CONFIG__;

        // apply config from server
        merge(appConfig, res.config);

        applyConfigurationDefaults(appConfig);

        // allow e2e tests to overwrite appConfig via local storage
        merge(appConfig, merge(appConfig, JSON.parse(localStorage.getItem('TEST_APP_CONFIG') ?? '{}')));

        window['appConfigLoaded'] = appConfig;
    },
);
