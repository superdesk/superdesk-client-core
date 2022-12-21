import {GET_LABEL_MAP} from '../content/constants';
import ng from 'core/services/ng';

export const getLabelForFieldId = (fieldId, vocabularies) => {
    const labelMap = GET_LABEL_MAP();
    const field = vocabularies.find((obj) => obj._id === fieldId);
    const categories =  vocabularies.find((v) => v._id === 'categories')

    if (fieldId === 'anpa_category' && categories) {
        return categories.display_name;
    }

    if (
        field != null
        && field.hasOwnProperty('display_name')
        && field['display_name'].length > 0
    ) {
        return field['display_name'];
    }

    if (labelMap.hasOwnProperty(fieldId)) {
        return labelMap[fieldId];
    }

    console.warn(`could not find label for ${fieldId}. Please create a Custom Vocabulary or add it to:` +
        'apps/workspace/content/constants.ts:GET_LABEL_MAP');

    return fieldId.charAt(0).toUpperCase() + fieldId.substr(1).toLowerCase();
};

export const getLabelNameResolver = () => ng.getService('vocabularies')
    .then((vocabulariesService) => vocabulariesService.getAllActiveVocabularies())
    .then((vocabulariesCollection) => (fieldId) => getLabelForFieldId(fieldId, vocabulariesCollection));
