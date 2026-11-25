import {IArticle} from 'superdesk-api';
import {store} from 'core/data';
import {testArticle} from 'test-data/test-article';
import {getSubjectAdapter} from './subject';

const vocabularyEntry = {qcode: 'item-1', name: 'item 1', scheme: 'custom-vocabulary-2'};

describe('subject adapter', () => {
    let subjectCodesOriginal;

    beforeEach(() => {
        subjectCodesOriginal = store.getState().subjectCodes;

        store.dispatch({
            type: 'LOAD_SUBJECT_CODES',
            payload: {
                '01000000': {qcode: '01000000', name: 'arts, culture and entertainment'},
                'item-1': {qcode: 'item-1', name: 'subject code sharing a qcode with a vocabulary item'},
            },
        });
    });

    afterEach(() => {
        store.dispatch({type: 'LOAD_SUBJECT_CODES', payload: subjectCodesOriginal});
    });

    it('keeps the values of custom vocabulary fields when storing subject codes', () => {
        const article = {...testArticle, subject: [vocabularyEntry]} as IArticle;

        const result = getSubjectAdapter().storeValue(['01000000'], article, {}, false);

        expect(result.subject).toEqual([
            vocabularyEntry,
            {qcode: '01000000', name: 'arts, culture and entertainment'},
        ]);
    });

    it('reads only subject codes, not the values of custom vocabulary fields', () => {
        const article = {
            ...testArticle,
            subject: [vocabularyEntry, {qcode: '01000000', name: 'arts, culture and entertainment'}],
        } as IArticle;

        expect(getSubjectAdapter().retrieveStoredValue(article, null, {})).toEqual(['01000000']);
    });
});
