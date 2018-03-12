/**
 * @ngdoc service
 * @module superdesk.apps.translations
 * @name TranslationService
 *
 * @requires api
 * @requires notify
 * @requires authoringWorkspace
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 *
 * @description Provides set of methods to translate items to different languages
 */

TranslationService.$inject = ['api', '$rootScope', 'notify', 'authoringWorkspace', 'desks'];
export function TranslationService(api, $rootScope, notify, authoringWorkspace, desks) {
    var service = {};

    /**
     * @ngdoc method
     * @name TranslationService#fetch
     * @public
     * @returns {Object} Languages
     * @description Fetch languages from database
     */
    service.fetch = function() {
        return api.query('languages');
    };

    /**
     * @ngdoc method
     * @name TranslationService#get
     * @public
     * @description Return list of langugages
     * @return {Object} list of items
     */
    service.get = function() {
        return service.languages;
    };

    /**
     * @ngdoc method
     * @name TranslationService#get
     * @public
     * @description Create copy of item with new language set
     * @param {Object} item item to be translated
     * @param {Object} language translate language
     */
    service.set = function(item, language) {
        var params = {
            guid: item.guid,
            language: language.language,
            desk: desks.getCurrentDeskId(),
        };

        api.save('translate', params).then((item) => {
            authoringWorkspace.open(item);
            $rootScope.$broadcast('item:translate');
            notify.success(gettext('Item Translated'));
        });
    };

    /**
     * @ngdoc method
     * @name TranslationService#checkAvailability
     * @public
     * @description Check if item is available for translating
     * @return {boolean}
     */
    service.checkAvailability = function(item) {
        return !service.languages ?
            false
            : _.find(service.languages._items, (language) => language.source && language.language === item.language);
    };

    // Fetch languages from database on service initialization
    service.fetch().then((languages) => {
        service.languages = languages;
    });

    return service;
}
