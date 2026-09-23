import {IArticle, IAuthoringFieldV2, IFieldAdapter, IDropdownConfigManualSource} from 'superdesk-api';
import {gettext} from 'core/utils';
import {sdApi} from 'api';

export const urgency: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const vocabulary = sdApi.vocabularies.getAll().get('urgency');

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
            type: 'number',
            // `short` then the qcode is the order authoring-angular reads the badge in
            // (metadata-dropdown.html), and `defaultUrgencyColors` mirrors `.urgency-label--<n>`
            // in styles/sass/labels.scss, which angular keys on the stored qcode rather than the
            // name. The two only coincide while a vocabulary names its items after their codes.
            options: vocabulary.items.map(({name, qcode, color, short}) => {
                const option: IDropdownConfigManualSource['options'][0] = {
                    id: qcode,
                    label: name,
                    badgeLabel: (short ?? '').toString().length > 0 ? short.toString() : qcode.toString(),
                    color: color ?? defaultUrgencyColors[qcode] ?? undefined,
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
    retrieveStoredValue: (article) => {
        return article.urgency;
    },
    storeValue: (value, article) => {
        return {
            ...article,
            urgency: value,
        };
    },
};
