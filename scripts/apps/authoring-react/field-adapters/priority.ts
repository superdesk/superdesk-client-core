import {IAuthoringFieldV2} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IFieldAdapter} from '.';
import {IDropdownConfigManualSource} from '../fields/dropdown';
import {authoringStorage} from '../data-layer';

export const priority: IFieldAdapter = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const vocabulary = authoringStorage.getVocabularies().get('priority');

        // HAS TO BE SYNCED WITH styles/sass/labels.scss
        var defaultPriorityColors = {
            0: '#cccccc',
            1: '#b82f00',
            2: '#de6237',
            3: '#e49c56',
            4: '#edc175',
            5: '#b6c28b',
            6: '#c0c9a1',
        };

        const fieldConfig: IDropdownConfigManualSource = {
            source: 'manual-entry',
            readOnly: fieldEditor.readonly,
            required: fieldEditor.required,
            type: 'number',
            options: vocabulary.items.map(({name, qcode, color}) => {
                const option: IDropdownConfigManualSource['options'][0] = {
                    id: qcode,
                    label: name,
                    color: color ?? defaultPriorityColors[name] ?? undefined,
                };

                return option;
            }),
            roundCorners: false,
            multiple: false,
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'priority',
            name: gettext('Priority'),
            fieldType: 'dropdown',
            fieldConfig,
        };

        return fieldV2;
    },
    retrieveStoredValue: (article) => {
        return article.priority;
    },
    storeValue: (value, article) => {
        return {
            ...article,
            priority: value,
        };
    },
};
