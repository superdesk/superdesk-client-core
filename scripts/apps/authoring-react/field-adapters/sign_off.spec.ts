import {IArticle} from 'superdesk-api';
import {testArticle} from 'test-data/test-article';
import {sign_off} from './sign_off';

const staleFieldsMeta: any = {draftjsState: [{blocks: [], entityMap: {}}]};
const otherFieldsMeta: any = {draftjsState: []};

describe('sign_off adapter', () => {
    it('reads the plain string and ignores a stale `fields_meta.sign_off`', () => {
        const article = {
            ...testArticle,
            sign_off: 'ADM/SG',
            fields_meta: {sign_off: staleFieldsMeta},
        } as unknown as IArticle;

        expect(sign_off.retrieveStoredValue(article, null as any, {})).toBe('ADM/SG');
    });

    it('stores the string and drops `fields_meta.sign_off` while keeping other keys', () => {
        const article = {
            ...testArticle,
            sign_off: 'ADM',
            fields_meta: {sign_off: staleFieldsMeta, headline: otherFieldsMeta},
        } as unknown as IArticle;

        const result = sign_off.storeValue('ADM/XYZ', article, {}, false);

        expect(result.sign_off).toBe('ADM/XYZ');
        expect(result.fields_meta).toEqual({headline: otherFieldsMeta});
        expect(article.fields_meta.sign_off).toBe(staleFieldsMeta);
    });

    it('does not add `fields_meta` to an item that has none', () => {
        const article = {...testArticle} as unknown as IArticle;

        delete article.fields_meta;

        const result = sign_off.storeValue('ADM', article, {}, false);

        expect(result.sign_off).toBe('ADM');
        expect('fields_meta' in result).toBe(false);
    });

    it('does not write `null` over a missing sign off', () => {
        const article = {...testArticle} as unknown as IArticle;

        delete article.sign_off;

        const result = sign_off.storeValue(null, article, {}, false);

        expect('sign_off' in result).toBe(false);
    });
});
