import {GET_LABEL_MAP} from '../content/constants';
import ng from 'core/services/ng';
import {gettext} from 'core/ui/components/utils';

export const getLabelNameResolver = () => ng.getServices(['vocabularies'])
    .then((services) => {
        const [vocabularies] = services;

        return vocabularies.getAllActiveVocabularies()
            .then((vocabularies) => [gettext, vocabularies]);
    })
    .then((res) => {
        const [gettext, vocabularies] = res;
        const labelMap = GET_LABEL_MAP(gettext);

        return (fieldId) => {
            if (labelMap.hasOwnProperty(fieldId)) {
                return labelMap[fieldId];
            }

            const field = vocabularies.find((obj) => obj._id === fieldId);

            if (
                field != null
                && field.hasOwnProperty('display_name')
                && field['display_name'].length > 0
            ) {
                return field['display_name'];
            }

            console.warn(`could not find label for ${fieldId}. Please add it in ` +
                '(apps/workspace/content/content/directives/ContentProfileSchemaEditor).' +
                'ContentProfileSchemaEditor/labelMap');

            return fieldId.charAt(0).toUpperCase() + fieldId.substr(1).toLowerCase();
        };
    });