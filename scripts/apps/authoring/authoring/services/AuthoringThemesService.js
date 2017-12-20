AuthoringThemesService.$inject = ['storage', 'preferencesService'];
export function AuthoringThemesService(storage, preferencesService) {
    var service = {};

    var PREFERENCES_KEY = 'editor:theme';

    var THEME_DEFAULT = {
        'font': 'sans',
        'theme': 'default',
        'headline': 'medium',
        'abstract': 'medium',
        'body': 'medium'
    };

    service.availableThemes = {
        fonts: [
            {
                label: 'Sans-serif (Roboto)',
                key: 'sans'
            },
            {
                label: 'Serif (Merriweather)',
                key: 'serif'
            },
            {
                label: 'Monospace (Roboto Mono)',
                key: 'mono'
            },
        ],
        colors: [
            {
                label: 'Default',
                key: 'default'
            },
            {
                label: 'Dark',
                key: 'dark'
            },
            {
                label: 'Blue',
                key: 'blue'
            },
            {
                label: 'Turquoise',
                key: 'turquoise'
            },
            {
                label: 'Military',
                key: 'military'
            },
            {
                label: 'Natural',
                key: 'natural'
            }
        ],
        sizes: [
            {
                label: 'S',
                key: 'small'
            },
            {
                label: 'M',
                key: 'medium'
            },
            {
                label: 'L',
                key: 'large'
            }
        ]
    };

    service.get = function(key) {
        return preferencesService.get().then((result) => {
            var theme = result[PREFERENCES_KEY] && result[PREFERENCES_KEY][key]  ?
            result[PREFERENCES_KEY][key] : THEME_DEFAULT;

            try {
                theme = JSON.parse(theme);
            } catch(e) {
                theme = THEME_DEFAULT;
            }

            return theme;
        });
    };

    service.save = function(key, theme) {
        return preferencesService.get().then((result) => {
            result[PREFERENCES_KEY][key] = JSON.stringify(theme);
            return preferencesService.update(result);
        });
    };

    return service;
}
