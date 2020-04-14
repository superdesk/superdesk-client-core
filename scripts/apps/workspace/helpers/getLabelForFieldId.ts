import {GET_LABEL_MAP} from '../content/constants';
import ng from 'core/services/ng';

const labelMap = GET_LABEL_MAP();

export const getLabelForFieldId = (fieldId, vocabularies) => {
    const field = vocabularies.find((obj) => obj._id === fieldId);

    if (fieldId === 'anpa_category') {
        return vocabularies.find((v) => v._id === 'categories').display_name;
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
