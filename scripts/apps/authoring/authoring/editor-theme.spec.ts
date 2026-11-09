import {
    EDITOR_THEME_DEFAULT,
    getEditorThemeColors,
    getEditorThemeStyle,
    IEditorTheme,
    normalizeEditorTheme,
} from './editor-theme';

const ANGULAR_DARK_SERIF: IEditorTheme = {
    font: 'serif',
    theme: 'dark',
    headline: 'small',
    abstract: 'medium',
    body: 'large',
};

describe('editor theme', () => {
    describe('normalizeEditorTheme', () => {
        it('keeps a theme stored by angular, as JSON or as an object', () => {
            expect(normalizeEditorTheme(JSON.stringify(ANGULAR_DARK_SERIF))).toEqual(ANGULAR_DARK_SERIF);
            expect(normalizeEditorTheme(ANGULAR_DARK_SERIF)).toEqual(ANGULAR_DARK_SERIF);
        });

        it('reads a theme stored by authoring-react as colours and a font family', () => {
            const storedByReact = {
                font: 'sans', // left over from the angular theme the react one was spread over
                theme: '#1b1e19',
                headline: 'medium',
                abstract: 'medium',
                body: 'large',
                fontFamily: '"Merriweather", Georgia, "Times New Roman", Times, serif',
                themeColorSecondary: '#23282e',
                textColor: 'white',
            };

            expect(normalizeEditorTheme(JSON.stringify(storedByReact))).toEqual({
                font: 'serif',
                theme: 'dark',
                headline: 'medium',
                abstract: 'medium',
                body: 'large',
            });
        });

        it('maps every colour authoring-react used to store to its key', () => {
            const legacy = {
                '#ffffff': 'default',
                '#1B1E19': 'dark',
                '#06356a': 'blue',
                '#00ced1': 'turquoise',
                '#959f60': 'military',
                '#efe9c5': 'natural',
            };

            Object.keys(legacy).forEach((color) => {
                expect(normalizeEditorTheme({theme: color}).theme).toBe(legacy[color]);
            });
        });

        it('reads a font family regardless of quotes and spacing', () => {
            expect(normalizeEditorTheme({fontFamily: '\'Roboto Mono\', Consolas, monaco, monospace'}).font)
                .toBe('mono');
        });

        it('returns the default theme for missing or unreadable values', () => {
            [undefined, null, '', 'not json', '42', 42, []].forEach((value) => {
                expect(normalizeEditorTheme(value)).toEqual(EDITOR_THEME_DEFAULT);
            });
        });

        it('replaces each unknown property with the default one and drops extra properties', () => {
            expect(normalizeEditorTheme({
                font: 'comic',
                theme: 'rgb(1, 2, 3)',
                headline: 'huge',
                abstract: 'small',
                body: null,
                textColor: 'white',
            })).toEqual({
                ...EDITOR_THEME_DEFAULT,
                abstract: 'small',
            });
        });

        it('returns a copy that callers may change', () => {
            const theme = normalizeEditorTheme(undefined);

            theme.theme = 'dark';

            expect(EDITOR_THEME_DEFAULT.theme).toBe('default');
        });
    });

    describe('getEditorThemeStyle', () => {
        it('gives every theme valid CSS colours', () => {
            getEditorThemeColors().forEach(({key}) => {
                const style = getEditorThemeStyle({...EDITOR_THEME_DEFAULT, theme: key});

                [style.backgroundColor, style.backgroundColorSecondary].forEach((color) => {
                    expect(CSS.supports('color', color)).withContext(color).toBe(true);
                });

                expect(style.textColor).toMatch(/^var\(--color-text-on(light|dark)\)$/);
            });
        });

        it('paints the default theme white with dark text', () => {
            const style = getEditorThemeStyle(normalizeEditorTheme({theme: 'default'}));

            expect(style.backgroundColor).toBe('#ffffff');
            expect(style.textColor).toBe('var(--color-text-onlight)');
        });

        it('maps the font key to its font family', () => {
            expect(getEditorThemeStyle(ANGULAR_DARK_SERIF).fontFamily).toContain('Merriweather');
        });
    });
});

describe('authThemes service', () => {
    beforeEach(window.module('superdesk.core.preferences'));
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.apps.spellcheck'));

    let stored: {[key: string]: any};

    beforeEach(inject(($q, preferencesService) => {
        stored = {
            'editor:theme': {
                type: 'string',
                theme: JSON.stringify({
                    theme: '#06356a',
                    fontFamily: '"Roboto Mono", "Consolas", "monaco", monospace',
                    body: 'small',
                }),
            },
        };

        spyOn(preferencesService, 'get').and.callFake(() => $q.when(stored));
        spyOn(preferencesService, 'update').and.callFake((updates) => $q.when(updates));
    }));

    it('reads a theme stored by authoring-react in the shared shape', (done) => inject((authThemes, $rootScope) => {
        authThemes.get('theme').then((theme) => {
            expect(theme).toEqual({...EDITOR_THEME_DEFAULT, font: 'mono', theme: 'blue', body: 'small'});
            done();
        });

        $rootScope.$digest();
    }));

    it('returns the default theme when none is stored', (done) => inject((authThemes, $rootScope) => {
        authThemes.get('proofreadTheme').then((theme) => {
            expect(theme).toEqual(EDITOR_THEME_DEFAULT);
            done();
        });

        $rootScope.$digest();
    }));

    it('stores only the shared shape', (done) => inject((authThemes, $rootScope) => {
        authThemes.saveBoth({
            default: {...ANGULAR_DARK_SERIF, textColor: 'white'},
            proofreading: {theme: '#1b1e19'},
        }).then(() => {
            expect(JSON.parse(stored['editor:theme'].theme)).toEqual(ANGULAR_DARK_SERIF);
            expect(JSON.parse(stored['editor:theme'].proofreadTheme)).toEqual({
                ...EDITOR_THEME_DEFAULT,
                theme: 'dark',
            });
            done();
        });

        $rootScope.$digest();
    }));
});
