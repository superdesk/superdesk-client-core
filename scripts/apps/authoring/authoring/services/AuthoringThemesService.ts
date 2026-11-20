import {
    EDITOR_THEME_DEFAULT,
    getEditorThemeColors,
    getEditorThemeFonts,
    IEditorTheme,
    normalizeEditorTheme,
} from '../editor-theme';

export var PREFERENCES_KEY = 'editor:theme';

export var DEFAULT_EDITOR_THEME = {
    type: 'string',
    theme: EDITOR_THEME_DEFAULT,
};

AuthoringThemesService.$inject = ['storage', 'preferencesService'];
export function AuthoringThemesService(storage, preferencesService) {
    var service: any = {};

    service.availableThemes = {
        fonts: getEditorThemeFonts().map(({key, label}) => ({key, label})),
        colors: getEditorThemeColors().map(({key, label}) => ({key, label})),
        sizes: [
            {
                label: 'S',
                key: 'small',
            },
            {
                label: 'M',
                key: 'medium',
            },
            {
                label: 'L',
                key: 'large',
            },
        ],
    };

    service.get = function(key: string): Promise<IEditorTheme> {
        return preferencesService.get().then((result) => normalizeEditorTheme(result[PREFERENCES_KEY]?.[key]));
    };

    service.save = function(key: string, theme: IEditorTheme) {
        return preferencesService.get().then((result) => {
            result[PREFERENCES_KEY][key] = JSON.stringify(normalizeEditorTheme(theme));
            return preferencesService.update(result);
        });
    };

    service.saveBoth = function(payload: {default: IEditorTheme; proofreading: IEditorTheme}): Promise<any> {
        return preferencesService.get().then((result) => {
            result[PREFERENCES_KEY]['theme'] = JSON.stringify(normalizeEditorTheme(payload.default));
            result[PREFERENCES_KEY]['proofreadTheme'] = JSON.stringify(normalizeEditorTheme(payload.proofreading));
            return preferencesService.update(result);
        });
    };

    // when the user change theme of application, the theme of editor will inherit the app's
    service.syncWithApplicationTheme = (appTheme: string, themeObject: any) => {
        let activeThemeObject = normalizeEditorTheme(themeObject);

        if (activeThemeObject.theme === 'default' || activeThemeObject.theme === 'dark') {
            let activeTheme = appTheme === 'dark-ui'
                ? {...activeThemeObject, theme: 'dark'}
                : {...activeThemeObject, theme: 'default'};

            return activeTheme;
        } else {
            return activeThemeObject;
        }
    };

    return service;
}
