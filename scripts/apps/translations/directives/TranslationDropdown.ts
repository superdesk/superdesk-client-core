import _ from 'lodash';

/**
 * @ngdoc directive
 * @module superdesk.apps.translations
 * @name sdTranslationDropdown
 *
 * @requires TranslationService
 *
 * @param {Object} [langugages] collection of languages
 *
 * @description Creates dropdown element with list of available languages
 */

TranslationDropdown.$inject = ['TranslationService'];
export function TranslationDropdown(TranslationService) {
    return {
        templateUrl: 'scripts/apps/translations/views/TranslationDropdown.html',
        link: function(scope) {
            scope.languages = _.filter(TranslationService.languages._items, {destination: true});

            /*
             * Check if item language and button language are same
             * @param {Object} Language
             * @return {Boolean}
             */
            scope.isCurrentLanguage = function(language) {
                return scope.item && scope.item.language === language.language;
            };

            /*
             * Function for translating item
             * @param {Object} New language
             */
            scope.translateItem = function(language) {
                TranslationService.set(scope.item, language);
            };
        },
    };
}
