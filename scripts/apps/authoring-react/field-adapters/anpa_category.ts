import {Map} from 'immutable';
import {IArticle, IAuthoringFieldV2, IFieldAdapter, IVocabularyItem} from 'superdesk-api';
import {IDropdownConfigVocabulary, IDropdownValue} from '../fields/dropdown';
import {isMultiple} from './utilities';
import {sdApi} from 'api';

const vocabularyId = 'categories';

export const anpa_category: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const vocabulary = sdApi.vocabularies.getAll().get(vocabularyId);
        const multiple = isMultiple(vocabularyId);

        const fieldConfig: IDropdownConfigVocabulary = {
            source: 'vocabulary',
            vocabularyId: vocabularyId,
            multiple: multiple,
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'anpa_category',
            name: vocabulary.display_name,
            fieldType: 'dropdown',
            fieldConfig,
        };

        return fieldV2;
    },
    retrieveStoredValue: (article) => {
        const multiple = isMultiple(vocabularyId);
        const values = (article.anpa_category ?? []).map(({qcode}) => qcode);

        if (multiple) {
            return values;
        } else {
            return values[0] ?? null;
        }
    },
    storeValue: (val: IDropdownValue, article) => {
        const vocabulary = sdApi.vocabularies.getAll().get(vocabularyId);

        const vocabularyItems = Map<IVocabularyItem['qcode'], IVocabularyItem>(
            vocabulary.items.map((item) => [item.qcode, item]),
        );

        if (Array.isArray(val)) {
            return {
                ...article,
                anpa_category: val.map((qcode) => ({
                    qcode,
                    ...(vocabularyItems.get(qcode.toString()) ?? {}),
                })),
            };
        } else if (val == null) {
            return {
                ...article,
                anpa_category: null,
            };
        } else {
            const qcode = val;

            return {
                ...article,
                anpa_category: [{qcode, ...(vocabularyItems.get(qcode.toString()) ?? {})}],
            };
        }
    },
};
