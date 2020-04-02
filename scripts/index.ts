import 'app.scss'; // styles
import 'vendor';
import 'core';
import 'templates-cache.generated'; // generated by grunt 'ngtemplates' task
import 'apps';
import 'external-apps';
import {appConfig, IDENTITY_KEY} from 'appConfig';
import {IConfigurableUiComponents, IExtension, IUser} from 'superdesk-api';
import {CC} from 'core/ui/configurable-ui-components';
import {registerExtensions} from 'core/register-extensions';
import {setupTansa} from 'apps/tansa';
import {translationsForAngular, i18n} from 'core/utils';

let body = angular.element('body');

function loadConfigs() {
    return fetch(appConfig.server.url + '/client_config', {
        method: 'GET',
        mode: 'cors',
    })
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((json) => {
            Object.assign(appConfig, json.config);
        });
}

function loadTranslations() {
    const user: IUser = JSON.parse(localStorage.getItem(IDENTITY_KEY));

    fetch(`/languages/${user.language}.json`)
        .then((response) => response.json())
        .then((translations) => {
            const allTranslations = Object.assign({}, translations);

            const langOverride = appConfig.langOverride ?? {};

            Object.keys(langOverride).forEach((languageCode) => {
                if (allTranslations[languageCode] != null) {
                    Object.assign(allTranslations[languageCode], langOverride[languageCode]);
                }
            });

            Object.keys(allTranslations).forEach((languageCode) => {
                i18n.setMessages('messages', languageCode, allTranslations[languageCode], 'nplurals=2; plural=n>1;');
            });

            i18n.setLocale(user.language);

            Object.assign(translationsForAngular, allTranslations);
        });
}

let started = false;

function isDateFormatValid() {
    const {dateformat} = appConfig.view;

    if (
        dateformat.includes('YYYY') !== true
        || dateformat.includes('MM') !== true
        || dateformat.includes('DD') !== true
    ) {
        return false;
    }

    const separators = dateformat
        .replace('YYYY', '')
        .replace('MM', '')
        .replace('DD', '');

    if (separators.length !== 2 || separators[0] !== separators[1]) {
        return false;
    }

    return true;
}

export function startApp(
    extensions: Array<IExtension>,
    customUiComponents: IConfigurableUiComponents,
) {
    if (started === true) {
        return;
    }

    started = true;

    for (const key in customUiComponents) {
        if (customUiComponents.hasOwnProperty(key)) {
            CC[key] = customUiComponents[key];
        }
    }

    // update config via config.js
    if (window.superdeskConfig) {
        angular.merge(appConfig, window.superdeskConfig);
    }

    // non-mock app configuration must live here to allow tests to override
    // since tests do not import this file.
    angular.module('superdesk.config').constant('config', appConfig);

    // added to be able to register activities which didn't work using superdesk reference injected in `core.run`.
    var _superdesk;

    angular.module('superdesk.register_extensions', [])
        .config(['superdeskProvider', (superdesk) => {
            _superdesk = superdesk;
        }])
        .run([
            'modal',
            'privileges',
            'lock',
            'session',
            'authoringWorkspace',
            'config',
            'metadata',
            (
                modal,
                privileges,
                lock,
                session,
                authoringWorkspace,
                config,
                metadata,
            ) => {
                registerExtensions(
                    extensions,
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

    loadConfigs()
        .then(() => loadTranslations())
        .then(() => {
            if (isDateFormatValid() !== true) {
                document.write('Invalid date format specified in config.view.dateFormat');
                return;
            }
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
                'superdesk.register_extensions',
            ].concat(appConfig.apps || []), {strictDi: true});

            window['superdeskIsReady'] = true;

            if (appConfig.features.useTansaProofing) {
                setupTansa();
            }
        });
}

// the application should be started by importing and calling `startApp` from a customer repository
// this is a fallback for e2e tests.
setTimeout(() => {
    if (started !== true) {
        startApp([], {});
    }
}, 500);
