import {IDENTITY_KEY, appConfig} from 'appConfig';
import {getUserLanguage} from 'reload-language';
import {ISuperdeskGlobalConfig} from 'superdesk-api';

function makeConfig(
    profileLanguages: Array<string> | undefined,
    defaultLanguage?: string,
): ISuperdeskGlobalConfig {
    return {...appConfig, profileLanguages, default_language: defaultLanguage};
}

describe('getUserLanguage', () => {
    let browserLanguage: string;

    beforeEach(() => {
        localStorage.clear();
        browserLanguage = 'en-US';
        spyOnProperty(window.navigator, 'language', 'get').and.callFake(() => browserLanguage);
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('browser language', () => {
        it('matches a hyphenated browser language to an underscore profile language', () => {
            browserLanguage = 'sv-SE';
            expect(getUserLanguage(makeConfig(['en', 'sv_SE']))).toBe('sv_SE');
        });

        it('matches a hyphenated profile language', () => {
            browserLanguage = 'fr-CA';
            expect(getUserLanguage(makeConfig(['en', 'fr-CA']))).toBe('fr-CA');
        });

        it('falls back to the base language', () => {
            browserLanguage = 'fr-FR';
            expect(getUserLanguage(makeConfig(['en', 'fr']))).toBe('fr');
        });

        it('falls back to the only configured regional variant', () => {
            browserLanguage = 'sv';
            expect(getUserLanguage(makeConfig(['en', 'sv_SE']))).toBe('sv_SE');
        });

        it('does not guess between several regional variants', () => {
            browserLanguage = 'zh';
            expect(getUserLanguage(makeConfig(['en', 'zh_CN', 'zh_TW']))).toBe('en');
        });

        it('returns the first match in configured order', () => {
            browserLanguage = 'fr-CA';
            expect(getUserLanguage(makeConfig(['en', 'fr_CA', 'fr-CA']))).toBe('fr_CA');
        });
    });

    describe('configured language', () => {
        it('matches default_language with a different separator or case', () => {
            expect(getUserLanguage(makeConfig(['en', 'sv-SE'], 'sv_SE'))).toBe('sv-SE');
            expect(getUserLanguage(makeConfig(['en', 'sv_SE'], 'SV-se'))).toBe('sv_SE');
        });

        it('matches user language with a different separator', () => {
            localStorage.setItem(IDENTITY_KEY, JSON.stringify({language: 'fr_CA'}));
            expect(getUserLanguage(makeConfig(['en', 'fr-CA'], 'sv_SE'))).toBe('fr-CA');
        });

        it('prefers user language over logged out language and default_language', () => {
            localStorage.setItem(IDENTITY_KEY, JSON.stringify({language: 'de_DE'}));
            localStorage.setItem('LOGGED_OUT_LANGUAGE', 'fr');
            expect(getUserLanguage(makeConfig(['en', 'de_DE', 'fr', 'sv_SE'], 'sv_SE'))).toBe('de_DE');
        });
    });

    describe('fallback to "en"', () => {
        it('when no profile languages are configured', () => {
            browserLanguage = 'sv-SE';
            expect(getUserLanguage(makeConfig(undefined, 'sv_SE'))).toBe('en');
        });

        it('when nothing matches', () => {
            browserLanguage = 'ja-JP';
            expect(getUserLanguage(makeConfig(['en', 'sv_SE']))).toBe('en');
        });
    });
});
