import {GET_LABEL_MAP} from '../content/constants';
import ng from 'core/services/ng';
import {gettext} from 'core/ui/components/utils';

const labelMap = GET_LABEL_MAP(gettext);

export const getLabelForFieldId = (fieldId, vocabularies) => {
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

export const getLabelNameResolver = () => ng.getService('vocabularies')
    .then((vocabulariesService) => vocabulariesService.getAllActiveVocabularies())
    .then((vocabulariesCollection) => (fieldId) => getLabelForFieldId(fieldId, vocabulariesCollection));
