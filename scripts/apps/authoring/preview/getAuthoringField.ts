import {IArticle, IVocabulary} from 'superdesk-api';
import {IAuthoringField} from './types';
import {formatDate} from 'core/get-superdesk-api-implementation';
import {getRelatedArticles, getRelatedMedia} from '../authoring/controllers/AssociationController';

export function getAuthoringField(
    fieldId: string,
    item: IArticle,
    customFieldsVocabularies: Array<IVocabulary>,
): IAuthoringField {
    const customField = customFieldsVocabularies.find(({_id}) => _id === fieldId);

    if (customField?.field_type === 'text') {
        return {
            type: 'html',
            id: fieldId,
            value: item['extra'][fieldId],
        };
    } else if (customField?.field_type === 'date') {
        return {
            type: 'plain-text',
            id: fieldId,
            value: formatDate(new Date(item['extra'][fieldId])),
        };
    } else if (customField?.field_type === 'embed') {
        return {
            type: 'embed',
            id: fieldId,
            value: item['extra'][fieldId],
        };
    } else if (customField?.field_type === 'urls') {
        return {
            type: 'urls',
            id: fieldId,
            value: item['extra'][fieldId],
        };
    }  else if (customField?.field_type === 'related_content') {
        return {
            type: 'related-articles',
            id: fieldId,
            value: getRelatedArticles(item.associations, customField._id),
        };
    }  else if (customField?.field_type === 'media') {
        return {
            type: 'media-gallery',
            id: fieldId,
            value: getRelatedMedia(item.associations, customField._id),
        };
    } else if (customField?.custom_field_type != null) {
        return {
            type: 'custom',
            id: fieldId,
            value: {item: item, field: customField},
        };
    } else if (fieldId === 'feature_media') {
        return {
            type: 'media-gallery',
            id: fieldId,
            value: item.associations.featuremedia == null ? [] : [item.associations.featuremedia],
        };
    } else if (['abstract', 'body_html', 'body_footer'].includes(fieldId)) {
        return {
            type: 'html',
            id: fieldId,
            value: item[fieldId],
        };
    } else if (['anpa_category', 'genre'].includes(fieldId)) {
        return {
            type: 'subjects',
            id: fieldId,
            value: item[fieldId],
        };
    } else if (fieldId === 'place') {
        return {
            type: 'subjects',
            id: fieldId,
            value: item[fieldId]?.map(({name, code}) => ({name, qcode: code})),
        };
    } else if (fieldId === 'authors') {
        return {
            type: 'subjects',
            id: fieldId,
            value: item[fieldId]?.map(({_id, name}) => ({name, qcode: _id})),
        };
    }  else if (fieldId === 'keywords') {
        return {
            type: 'subjects',
            id: fieldId,
            value: item[fieldId]?.map((keyword) => ({name: keyword, qcode: keyword})),
        };
    } else if ([
        'products',
        'languages',
        'PhotoCategories',
        'destination',
        'company_codes',
    ].includes(fieldId)) {
        return {
            type: 'subjects',
            id: fieldId,
            value: item['subject']?.filter(({scheme}) => scheme === fieldId),
        };
    } else if (fieldId === 'subject') {
        return {
            type: 'subjects',
            id: fieldId,
            value: item['subject']?.filter(({scheme}) => scheme == null),
        };
    } else if ([
        'slugline',
        'anpa_take_key',
        'byline',
        'ednote',
        'headline',
        'sign_off',
        'usageterms',
        'description_text',
    ].includes(fieldId)) {
        return {
            type: 'plain-text',
            id: fieldId,
            value: item[fieldId],
        };
    } else if (fieldId === 'sms') {
        return {
            type: 'plain-text',
            id: fieldId,
            value: item['sms_message'],
        };
    } else if (fieldId === 'dateline') {
        return {
            type: 'plain-text',
            id: fieldId,
            value: item['dateline']['text'],
        };
    } else if (fieldId === 'priority' || fieldId === 'urgency') {
        return {
            type: 'plain-text',
            id: fieldId,
            value: item[fieldId].toString(),
        };
    } else if (fieldId === 'attachments') {
        return {
            type: 'attachments',
            id: fieldId,
            value: item[fieldId],
        };
    } else if (fieldId === 'language') {
        return {
            type: 'vocabulary-values',
            id: fieldId,
            value: {vocabularyId: 'languages', qcodes: [item[fieldId]]},
        };
    } else if (fieldId === 'footer') {
        // Does not have it's own separate field. Current implementation can change body_footer
        // but body_footer has it's own field in content profile.
        return null;
    } else {
        return null;
    }
}
