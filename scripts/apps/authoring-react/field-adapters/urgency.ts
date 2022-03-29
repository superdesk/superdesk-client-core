import {IAuthoringFieldV2} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IFieldAdapter} from '.';
import {IDropdownConfigManualSource} from '../fields/dropdown';
import {authoringStorage} from '../data-layer';

export const urgency: IFieldAdapter = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const vocabulary = authoringStorage.getVocabularies().get('urgency');

        // HAS TO BE SYNCED WITH styles/sass/labels.scss
        var defaultUrgencyColors = {
            0: '#cccccc',
            1: '#01405b',
            2: '#005e84',
            3: '#3684a4',
            4: '#64a4bf',
            5: '#a1c6d8',
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
                    color: color ?? defaultUrgencyColors[name] ?? undefined,
                };

                return option;
            }),
            roundCorners: true,
            multiple: false,
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'urgency',
            name: gettext('Urgency'),
            fieldType: 'dropdown',
            fieldConfig,
        };

        return fieldV2;
    },
};
