TranslationService.$inject = ['api', '$rootScope', 'notify', 'authoringWorkspace'];
export function TranslationService(api, $rootScope, notify, authoringWorkspace) {
    var service = {};

    service.fetch = function () {
        return api.query('languages').then(function (languages) {
            service.languages = languages;
        });
    };

    service.get = function () {
        return service.languages;
    };

    service.set = function (item, language) {
        var params = {
            guid: item.guid,
            language: language.language
        };

        api.save('translate', params).then(function (item) {
            authoringWorkspace.open(item);
            $rootScope.$broadcast('item:translate');
            notify.success(gettext('Item Translated'));
        });
    };

    service.fetch();

    return service;
}