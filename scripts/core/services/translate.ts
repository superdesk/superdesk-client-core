import 'angular-dynamic-locale';
import moment from 'moment';
import {gettext} from 'core/utils';

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
            $rootScope.$on(SESSION_EVENTS.IDENTITY_LOADED, () => {
                const {translations} = window;
                const language = translations['']['language'];

                gettextCatalog.setCurrentLanguage(language);
                gettextCatalog.setStrings(language, translations);
                moment.locale(language); // set locale for date/time management

                // set locale for angular-i18n
                tmhDynamicLocale.set(language.replace('_', '-').toLowerCase());
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
