import {IArticleField} from 'superdesk-api';
import {gettext} from 'core/utils';

const TYPE_LABEL = {
    text: gettext('text'),
    media: gettext('related content'),
    date: gettext('date'),
    embed: gettext('embed'),
    related_content: gettext('related content'),
};

export const getLabelForType = (fieldType: IArticleField['field_type']) => {
    if (TYPE_LABEL.hasOwnProperty(fieldType)) {
        return TYPE_LABEL[fieldType];
    }

    return gettext('custom vocabulary');
};

export const getTypeForFieldId = (fieldId, vocabularies: Array<IArticleField>) => {
    const vocabulary = vocabularies.find((obj) => obj._id === fieldId);

    if (vocabulary && vocabulary.field_type) {
        return getLabelForType(vocabulary.field_type);
    }

    return '';
};
