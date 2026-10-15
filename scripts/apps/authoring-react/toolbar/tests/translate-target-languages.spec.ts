import {ITranslation} from 'superdesk-api';
import {getTranslationTargetLanguages} from '../translate-modal';

function language(code: string, destination: boolean): ITranslation {
    return {_id: code, language: code, label: code.toUpperCase(), source: true, destination} as ITranslation;
}

describe('getTranslationTargetLanguages', () => {
    const languages = [
        language('nl', true),
        language('fr', true),
        language('en', true),
        language('de', false),
    ];

    it('drops languages that are not translation destinations', () => {
        expect(getTranslationTargetLanguages(languages, 'en').map((l) => l.language)).not.toContain('de');
    });

    it('drops the language the article is already in', () => {
        expect(getTranslationTargetLanguages(languages, 'en').map((l) => l.language)).not.toContain('en');
    });

    it('keeps the remaining destinations in their original order', () => {
        expect(getTranslationTargetLanguages(languages, 'en').map((l) => l.language)).toEqual(['nl', 'fr']);
        expect(getTranslationTargetLanguages(languages, 'fr').map((l) => l.language)).toEqual(['nl', 'en']);
    });

    it('returns an empty list rather than throwing when nothing qualifies', () => {
        expect(getTranslationTargetLanguages([], 'en')).toEqual([]);
        expect(getTranslationTargetLanguages([language('en', true)], 'en')).toEqual([]);
    });
});
