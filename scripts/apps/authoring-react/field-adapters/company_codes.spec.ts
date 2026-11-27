import {sdApi} from 'api';
import {OrderedMap} from 'immutable';
import {IArticle, IVocabulary, IVocabularyItem} from 'superdesk-api';
import {testVocabulary} from 'test-data/test-vocabulary';
import {getBaseFieldsAdapter} from '.';
import {company_codes, shouldOfferCompanyCodes} from './company_codes';

const vocabulariesOriginal = sdApi.vocabularies;

function stubVocabularies(vocabularies: Array<Partial<IVocabulary>>): void {
    sdApi.vocabularies = {
        ...vocabulariesOriginal,
        getAll: () => OrderedMap<string, IVocabulary>(
            vocabularies.map((vocabulary) => [vocabulary._id, {...testVocabulary, ...vocabulary} as IVocabulary]),
        ),
    };
}

describe('company_codes adapter', () => {
    afterEach(() => {
        sdApi.vocabularies = vocabulariesOriginal;
    });

    it('is offered for the finance category or a finance subject, or when codes are already set', () => {
        expect(shouldOfferCompanyCodes([], ['a'], ['01000000'])).toBe(false);
        expect(shouldOfferCompanyCodes(undefined, null, undefined)).toBe(false);

        expect(shouldOfferCompanyCodes([], ['a', 'f'], [])).toBe(true);
        expect(shouldOfferCompanyCodes([], 'f', [])).toBe(true);
        expect(shouldOfferCompanyCodes([], [], ['04006018'])).toBe(true);
        expect(shouldOfferCompanyCodes(['ERB'], [], [])).toBe(true);
    });

    it('is only available when the company_codes vocabulary exists', () => {
        stubVocabularies([{_id: 'categories', items: []}]);
        expect(getBaseFieldsAdapter().company_codes).toBeUndefined();

        stubVocabularies([{_id: 'categories', items: []}, {_id: 'company_codes', items: []}]);
        expect(getBaseFieldsAdapter().company_codes).toBe(company_codes);
    });

    it('stores the picked codes with their name and exchange', () => {
        stubVocabularies([{
            _id: 'company_codes',
            items: [{qcode: 'ERB', name: 'Erebor Mining', security_exchange: 'ASX'} as IVocabularyItem],
        }]);

        const article = company_codes.storeValue(['ERB'], {} as IArticle, {}, false);

        expect(article.company_codes).toEqual([{qcode: 'ERB', name: 'Erebor Mining', security_exchange: 'ASX'}]);
        expect(company_codes.retrieveStoredValue(article, null, {})).toEqual(['ERB']);
    });
});
