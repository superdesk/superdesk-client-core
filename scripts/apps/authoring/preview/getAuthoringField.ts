import {IArticle, IVocabulary, IAuthoringField} from 'superdesk-api';
import {formatDate} from 'core/get-superdesk-api-implementation';
import {getRelatedArticles, getRelatedMedia} from '../authoring/controllers/AssociationController';

export function getAuthoringField(
    fieldId: string,
    item: Partial<IArticle>,
    customFieldsVocabularies: Array<IVocabulary>,
): IAuthoringField {
    const customField = customFieldsVocabularies.find(({_id}) => _id === fieldId);

    switch (customField?.field_type) {
    case 'text':
        return {
            type: 'html',
            id: fieldId,
            value: item.extra?.[fieldId],
        };

    case 'date':
        return {
            type: 'plain-text',
            id: fieldId,
            value: item.extra?.[fieldId] == null ? null : formatDate(new Date(item.extra[fieldId])),
        };

    case 'embed':
        return {
            type: 'embed',
            id: fieldId,
            value: item.extra?.[fieldId],
        };

    case 'urls':
        return {
            type: 'urls',
            id: fieldId,
            value: item.extra?.[fieldId],
        };

    case 'related_content':
        return {
            type: 'related-articles',
            id: fieldId,
            value: getRelatedArticles(item.associations, customField._id),
        };

    case 'media':
        return {
            type: 'media-gallery',
            id: fieldId,
            value: getRelatedMedia(item.associations, customField._id),
        };

    default:
        if (customField?.custom_field_type != null) {
            return {
                type: 'custom',
                id: fieldId,
                value: {item: item, field: customField},
            };
        }

        switch (fieldId) {
        case 'feature_media':
            return {
                type: 'media-gallery',
                id: fieldId,
                value: item.associations?.featuremedia == null ? [] : [item.associations.featuremedia],
            };

        case 'abstract':
        case 'body_html':
        case 'body_footer':
            return {
                type: 'html',
                id: fieldId,
                value: item[fieldId],
            };

        case 'anpa_category':
        case 'genre':
            return {
                type: 'subjects',
                id: fieldId,
                value: item[fieldId],
            };

        case 'place':
            return {
                type: 'subjects',
                id: fieldId,
                value: item.place?.map(({name, qcode}) => ({name, qcode})),
            };

        case 'authors':
            return {
                type: 'subjects',
                id: fieldId,
                value: item[fieldId]?.map(({_id, name}) => ({name, qcode: (_id?.[1] ?? name)})),
            };

        case 'keywords':
            return {
                type: 'subjects',
                id: fieldId,
                value: item[fieldId]?.map((keyword) => ({name: keyword, qcode: keyword})),
            };

        case 'products':
        case 'languages':
        case 'PhotoCategories':
        case 'destination':
        case 'company_codes':
            return {
                type: 'subjects',
                id: fieldId,
                value: item['subject']?.filter(({scheme}) => scheme === fieldId),
            };

        case 'subject':
            return {
                type: 'subjects',
                id: fieldId,
                value: item['subject']?.filter(({scheme}) => scheme == null),
            };

        case 'slugline':
        case 'anpa_take_key':
        case 'byline':
        case 'ednote':
        case 'headline':
        case 'sign_off':
        case 'usageterms':
        case 'description_text':
            return {
                type: 'plain-text',
                id: fieldId,
                value: item[fieldId],
            };

        case 'sms':
            return {
                type: 'plain-text',
                id: fieldId,
                value: item.sms_message,
            };

        case 'dateline':
            return {
                type: 'plain-text',
                id: fieldId,
                value: item.dateline?.text,
            };

        case 'priority':
        case 'urgency':
            return {
                type: 'plain-text',
                id: fieldId,
                value: item[fieldId]?.toString(),
            };

        case 'attachments':
            return {
                type: 'attachments',
                id: fieldId,
                value: item[fieldId],
            };

        case 'language':
            return {
                type: 'vocabulary-values',
                id: fieldId,
                value: {vocabularyId: 'languages', qcodes: [item[fieldId]]},
            };

        case 'footer':
            // Does not have it's own separate field. Current implementation can change body_footer
            // but body_footer has it's own field in content profile.
            return null;

        default:
            return null;
        }
    }
}
