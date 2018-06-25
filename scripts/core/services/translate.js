require('angular-dynamic-locale');

/**
 * Translate module
 *
 * This module provides localization support.
 * It's using angular-gettext.
 */
export default angular.module('superdesk.core.translate', [
    'gettext',
    'superdesk.core.auth.session',
    'tmh.dynamicLocale',
    'ngLocale',
])
    .config(['tmhDynamicLocaleProvider', (tmhDynamicLocaleProvider) => {
        tmhDynamicLocaleProvider.localeLocationPattern('locales/angular-locale_{{locale}}.js');
    }])

    .run(['gettextCatalog', 'config', '$location', '$rootScope', 'SESSION_EVENTS', 'tmhDynamicLocale',
        function(gettextCatalog, config, $location, $rootScope, SESSION_EVENTS, tmhDynamicLocale) {
            $rootScope.$on(SESSION_EVENTS.IDENTITY_LOADED, (event) => {
                if ($rootScope.$root.currentUser
                    && config.profileLanguages.includes($rootScope.$root.currentUser.language)) {
                    // if the current logged in user has a saved language preference that is available
                    gettextCatalog.setCurrentLanguage($rootScope.$root.currentUser.language);
                } else if (config.language) {
                    gettextCatalog.setCurrentLanguage(config.language);
                } else if (config.profileLanguages.includes(window.navigator.language)) {
                    // no saved preference but browser language is available
                    gettextCatalog.setCurrentLanguage(window.navigator.language);
                } else {
                    // no other options available go with baseLanguage
                    gettextCatalog.setCurrentLanguage(gettextCatalog.baseLanguage);
                }

                // load translations synchronously(blocking) in order to prevent caching of default strings
                if (gettextCatalog.currentLanguage !== 'en') {
                    gettextCatalog.loadRemoteSync('languages/' + gettextCatalog.currentLanguage + '.json');
                }

                // set locale for date/time management
                moment.locale(gettextCatalog.currentLanguage);
                // set locale for angular-i18n
                tmhDynamicLocale.set(gettextCatalog.currentLanguage.replace('_', '-').toLowerCase());
            });

            var params = $location.search();

            if ('lang' in params) {
                gettextCatalog.currentLanguage = params.lang;
                gettextCatalog.debug = true;
            }
        }])

    /**
     * @ngdoc factory
     * @module superdesk.core.services
     * @name gettext
     *
     * @description
     * Gettext service to be used in controllers/services/directives.
     *
     * Usage:
     * ```js
     * function($scope, gettext) { $scope.translatedMessage = gettext("Translate Me"); }
     * ```
     *
     * This way "Translate Me" can be found by the string extractor and it will return
     * translated string if appropriet.
     */
    .factory('gettext', ['gettextCatalog', function(gettextCatalog) {
        return function(input) {
            return gettextCatalog.getString(input);
        };
    }]);
