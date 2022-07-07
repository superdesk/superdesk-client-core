import {IArticle, IAuthoringFieldV2, IFieldAdapter} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IDropdownConfigVocabulary} from '../fields/dropdown';

export const language: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IDropdownConfigVocabulary = {
            source: 'vocabulary',
            vocabularyId: 'languages',
            multiple: false,
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'language',
            name: gettext('Language'),
            fieldType: 'dropdown',
            fieldConfig,
        };

        return fieldV2;
    },
    retrieveStoredValue: (article) => {
        return article.language;
    },
    storeValue: (value, article) => {
        return {
            ...article,
            language: value,
        };
    },
};
