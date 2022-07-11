import {Map} from 'immutable';
import {
    IArticle,
    IAuthoringFieldV2,
    IFieldAdapter,
    IVocabularyItem,
    IDropdownConfigVocabulary,
    IDropdownValue,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {isMultipleV2} from './utilities';
import {sdApi} from 'api';

export const genre: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const multiple = isMultipleV2('genre');

        const fieldConfig: IDropdownConfigVocabulary = {
            source: 'vocabulary',
            vocabularyId: 'genre',
            multiple: multiple,
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'genre',
            name: gettext('Genre'),
            fieldType: 'dropdown',
            fieldConfig,
        };

        return fieldV2;
    },
    retrieveStoredValue: (article) => {
        const multiple = isMultipleV2('genre');

        if (multiple) {
            return article.genre.map(({qcode}) => qcode);
        } else {
            return article.genre.map(({qcode}) => qcode)[0];
        }
    },
    storeValue: (val: IDropdownValue, article) => {
        const vocabulary = sdApi.vocabularies.getAll().get('genre');

        const vocabularyItems = Map<IVocabularyItem['qcode'], IVocabularyItem>(
            vocabulary.items.map((item) => [item.qcode, item]),
        );

        if (Array.isArray(val)) {
            return {
                ...article,
                genre: val.map((qcode) => ({qcode, name: vocabularyItems.get(qcode.toString())?.name ?? ''})),
            };
        } else if (val == null) {
            return {
                ...article,
                genre: null,
            };
        } else {
            const qcode = val;

            return {
                ...article,
                genre: [{qcode, name: vocabularyItems.get(qcode.toString())?.name ?? ''}],
            };
        }
    },
};
