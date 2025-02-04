import {appConfig} from 'appConfig';

/*
 * This module enables the 'tansa' spellchecker functionality and installs
 * it based on the documentation provided by the user guide.
 */

export const setupTansa = () => {
    if (!appConfig?.tansa?.base_url) {
        console.warn('tansa is not configured properly');
        appConfig.features.useTansaProofing = false;
        return;
    }

    const tansa = {
        settings: {
            baseUrl: appConfig.tansa.base_url,
            parentAppId: appConfig.tansa.app_id,
            tansaUserId: appConfig.tansa.user_id,
            licenseKey: appConfig.tansa.license_key,
            profileId: appConfig.tansa.profile_id,
            parentAppVersion: appConfig.tansa.app_version,
            checkboxPreference: false,
            clientExtenstionJs: 'tansa4ClientExtensionSimple.js',
        },
        useDocumentWriteFun: false,
    };

    // tansa apparently likes to polute window scope
    window.tansa = tansa;

    window.afterProofing = (isCancelled) => {
        let $rootScope = angular.element(document.body).injector().get('$rootScope');

        $rootScope.$broadcast('tansa:after', isCancelled);
        $rootScope.$broadcast('tansa:end', isCancelled);
    };

    let tansaLoaderScript = document.getElementById('tansaLoaderScript');

    if (!tansaLoaderScript) {
        const script = document.createElement('script');

        script.src = tansa.settings.baseUrl + 'tansaLoader.js?' + new Date().getTime();
        script.async = true;
        script.onload = () => {
            const setupBrowser = () => { // let tansa finish loading
                if (!window.tansaJQuery) {
                    return;
                }

                const browser = window.tansaJQuery.pgwBrowser();

                window.tansa.settings.platformName = browser.os.name;
                window.tansa.settings.platformVersion = browser.os.fullVersion;

                window.removeEventListener('load', setupBrowser);
            };

            window.addEventListener('load', setupBrowser);
        };

        document.querySelector('head').appendChild(script);
    }
};
