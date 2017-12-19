AuthoringThemesService.$inject = ['storage', 'preferencesService'];
export function AuthoringThemesService(storage, preferencesService) {
    var service = {};

    var PREFERENCES_KEY = 'editor:theme';
    var THEME_DEFAULT = 'default';

    service.availableThemes = [
        {
            cssClass: 'main-article--theme-default',
            label: 'Default',
            key: 'default'
        },
        {
            cssClass: 'main-article--theme-dark',
            label: 'Dark',
            key: 'dark'
        },
        {
            cssClass: 'main-article--theme-natural',
            label: 'Natural',
            key: 'natural'
        },
        {
            cssClass: 'main-article--theme-blue',
            label: 'Blue',
            key: 'dark-blue'
        },
        {
            cssClass: 'main-article--theme-turquoise',
            label: 'Turquoise',
            key: 'dark-turquoise'
        },
        {
            cssClass: 'main-article--theme-military',
            label: 'Military',
            key: 'dark-khaki'
        }
    ];

    service.save = function(key, themeScope) {
        return preferencesService.get().then((result) => {
            result[PREFERENCES_KEY][key] = themeScope[key].key + (themeScope.large[key] ? '-large' : '');
            return preferencesService.update(result);
        });
    };

    service.get = function(key) {
        return preferencesService.get().then((result) => {
            var theme = result[PREFERENCES_KEY] && result[PREFERENCES_KEY][key] ?
                result[PREFERENCES_KEY][key] : THEME_DEFAULT;

            return theme;
        });
    };

    return service;
}
