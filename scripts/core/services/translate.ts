import 'angular-dynamic-locale';
import moment from 'moment';
import {getUserInterfaceLanguage} from 'appConfig';
import {gettext, translationsForAngular} from 'core/utils';
import {loadTranslations} from 'index';

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

    .run(['gettextCatalog', '$location', '$rootScope', 'SESSION_EVENTS', 'tmhDynamicLocale',
        function(gettextCatalog, $location, $rootScope, SESSION_EVENTS, tmhDynamicLocale) {
            $rootScope.$on(SESSION_EVENTS.IDENTITY_LOADED, (event) => {
                loadTranslations().then(() => {
                    gettextCatalog.setCurrentLanguage(getUserInterfaceLanguage());

                    // load translations synchronously(blocking) in order to prevent caching of default strings
                    if (gettextCatalog.currentLanguage !== 'en') {
                        Object.keys(translationsForAngular).forEach((langCode) => {
                            gettextCatalog.setStrings(langCode, translationsForAngular[langCode]);
                        });
                    }

                    // set locale for date/time management
                    moment.locale(gettextCatalog.currentLanguage);
                    // set locale for angular-i18n
                    tmhDynamicLocale.set(gettextCatalog.currentLanguage.replace('_', '-').toLowerCase());
                });
            });

            var params = $location.search();

            if ('lang' in params) {
                gettextCatalog.currentLanguage = params.lang;
                gettextCatalog.debug = true;
            }

            // make it available in templates
            $rootScope.gettext = gettext;
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
