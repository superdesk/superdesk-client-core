AuthoringThemesService.$inject = ['storage', 'preferencesService'];
export function AuthoringThemesService(storage, preferencesService) {
    var service = {};

    var PREFERENCES_KEY = 'editor:theme';
    var THEME_DEFAULT = 'default';

    service.availableThemes = [
        {
            cssClass: '',
            label: 'Default',
            key: 'default'
        },
        {
            cssClass: 'dark-theme',
            label: 'Dark',
            key: 'dark'
        },
        {
            cssClass: 'natural-theme',
            label: 'Natural',
            key: 'natural'
        },
        {
            cssClass: 'dark-blue-theme',
            label: 'Dark blue',
            key: 'dark-blue'
        },
        {
            cssClass: 'dark-turquoise-theme',
            label: 'Dark turquoise',
            key: 'dark-turquoise'
        },
        {
            cssClass: 'dark-khaki-theme',
            label: 'Dark khaki',
            key: 'dark-khaki'
        },
        {
            cssClass: 'dark-theme-mono',
            label: 'Dark monospace',
            key: 'dark-mono'
        }
    ];

    service.save = function(key, themeScope) {
        return preferencesService.get().then(function(result) {
            result[PREFERENCES_KEY][key] = themeScope[key].key + (themeScope.large[key] ? '-large' : '');
            return preferencesService.update(result);
        });
    };

    service.get = function(key) {
        return preferencesService.get().then(function(result) {
            var theme = result[PREFERENCES_KEY] && result[PREFERENCES_KEY][key] ?
                result[PREFERENCES_KEY][key] : THEME_DEFAULT;
            return theme;
        });
    };

    return service;
}
