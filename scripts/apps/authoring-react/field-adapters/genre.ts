import {Map} from 'immutable';
import {IAuthoringFieldV2, IVocabularyItem} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IFieldAdapter} from '.';
import {IDropdownConfigVocabulary, IDropdownValue} from '../fields/dropdown';
import {isMultiple} from './utilities';
import {authoringStorage} from '../data-layer';

export const genre: IFieldAdapter = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const multiple = isMultiple('genre');

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
        const multiple = isMultiple('genre');

        if (multiple) {
            return article.genre.map(({qcode}) => qcode);
        } else {
            return article.genre.map(({qcode}) => qcode)[0];
        }
    },
    storeValue: (val: IDropdownValue, article) => {
        const vocabulary = authoringStorage.getVocabularies().get('genre');

        const vocabularyItems = Map<IVocabularyItem['qcode'], IVocabularyItem>(
            vocabulary.items.map((item) => [item.qcode, item]),
        );

        if (Array.isArray(val)) {
            return {
                ...article,
                genre: val.map((qcode) => ({qcode, name: vocabularyItems.get(qcode.toString())?.name ?? ''})),
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
