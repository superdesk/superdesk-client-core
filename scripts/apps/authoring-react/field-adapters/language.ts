import {IAuthoringFieldV2} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IFieldAdapter} from '.';
import {IDropdownConfigVocabulary} from '../fields/dropdown';

export const language: IFieldAdapter = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IDropdownConfigVocabulary = {
            readOnly: fieldEditor.readonly,
            required: fieldEditor.required,
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
