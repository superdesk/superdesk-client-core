import {VocabularyFieldType, IVocabulary} from 'superdesk-interfaces/Vocabulary';
import {gettext} from 'core/ui/components/utils';

// export type VocabularyFieldType = 'text' | 'media' | 'date' | 'embed' | 'related_content';
export const getLabelForType = (fieldType: VocabularyFieldType) => {
    switch (fieldType) {
        case 'text':
            return gettext('text');
        case 'media':
            return '';
        case 'date':
            return gettext('date');
        case 'embed':
            return gettext('embed');
        case 'related_content':
            return gettext('related content');
        default:
            return 'CV';
    }
};

export const getTypeForFieldId = (fieldId, vocabularies: Array<IVocabulary>) => {
    const vocabulary = vocabularies.find((obj) => obj._id === fieldId);

    if (vocabulary && vocabulary.field_type) {
        return getLabelForType(vocabulary.field_type);
    }

    return '';
};
