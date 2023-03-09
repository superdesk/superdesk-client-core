import {
    IArticle,
    IAuthoringFieldV2,
    IAuthoringStorage,
    IFieldsAdapter,
    IRelatedArticle,
    IDropdownConfigVocabulary,
    IEditor3Config,
    IEditor3ValueStorage,
    IDateFieldConfig,
    IDateShortcut,
    IUrlsFieldConfig,
    IEmbedConfig,
    IMediaConfig,
    IMediaValueOperational,
    ILinkedItemsConfig,
    ILinkedItemsValueOperational,
} from 'superdesk-api';
import {slugline} from './slugline';
import {body_html} from './body_html';
import {language} from './language';
import {genre} from './genre';
import {getPlaceAdapter} from './place';
import {authors} from './authors';
import {urgency} from './urgency';
import {priority} from './priority';
import {getSubjectAdapter} from './subject';
import {anpa_category} from './anpa_category';
import {getCustomFieldVocabularies} from 'core/helpers/business-logic';
import {sdApi} from 'api';
import {headline} from './headline';
import {abstract} from './abstract';
import {ednote} from './ednote';
import {anpa_take_key} from './anpa_take_key';
import {byline} from './byline';
import {sms_message} from './sms_message';
import {usageterms} from './usageterms';
import {feature_media} from './feature_media';
import {
    applyAssociations,
    getRelatedArticles,
    getRelatedMedia,
} from 'apps/authoring/authoring/controllers/AssociationController';
import {defaultAllowedWorkflows} from 'apps/relations/services/RelationsService';
import {attachments} from './attachments';
import {ContentState, convertToRaw, RawDraftContentState} from 'draft-js';
import {computeEditor3Output} from './utilities/compute-editor3-output';
import {package_items} from './package_items';
import {LINKED_ITEMS_FIELD_TYPE} from '../fields/linked-items';
import {getKeywordsAdapter} from './keywords';
import {dateline} from './dateline';
import {description_text} from './description_text';

export function getBaseFieldsAdapter(): IFieldsAdapter<IArticle> {
    const adapter: IFieldsAdapter<IArticle> = {
        abstract: abstract,
        anpa_category: anpa_category,
        anpa_take_key: anpa_take_key,
        attachments: attachments,
        authors: authors,
        body_html: body_html,
        byline: byline,
        ednote: ednote,
        feature_media: feature_media,
        genre: genre,
        headline: headline,
        language: language,
        place: getPlaceAdapter(),
        priority: priority,
        slugline: slugline,
        sms_message: sms_message,
        subject: getSubjectAdapter(),
        urgency: urgency,
        usageterms: usageterms,
        groups: package_items,
        keywords: getKeywordsAdapter(),
        dateline: dateline,
        description_text: description_text,
    };

    return adapter;
}

/**
 * Stores values in {@link IArticle.extra} field
 */
function storeEditor3ValueGeneric(
    fieldId: string,
    value: IEditor3ValueStorage,
    article: IArticle,
    config: IEditor3Config,
): IArticle {
    const result = storeEditor3ValueBase(fieldId, article, value, config);
    const articleUpdated = {...result.article};

    articleUpdated.extra = {
        ...(articleUpdated.extra ?? {}),
        [fieldId]: result.stringValue,
    };

    return articleUpdated;
}

/**
 * Universal function to retrieve stored values where field adapters are not present.
 */
export function retrieveStoredValueEditor3Generic(
    fieldId: string,
    article: IArticle,
    authoringStorage: IAuthoringStorage<IArticle>,
) {
    const rawContentState: RawDraftContentState = (() => {
        const fromFieldsMeta = article.fields_meta?.[fieldId]?.['draftjsState']?.[0] ?? null;
        const fieldsAdapter = getFieldsAdapter(authoringStorage);

        if (fromFieldsMeta != null) {
            return fromFieldsMeta;
        } else if (
            fieldsAdapter[fieldId] != null
            && typeof article[fieldId] === 'string'
            && article[fieldId].length > 0
        ) {
            /**
             * This is only for compatibility with angular based authoring.
             * create raw content state in case only text value is present.
             */

            return convertToRaw(ContentState.createFromText(article[fieldId]));
        } else {
            return convertToRaw(ContentState.createFromText(''));
        }
    })();

    const result: IEditor3ValueStorage = {
        rawContentState,
    };

    return result;
}

export function storeEditor3ValueBase(
    fieldId: string,
    article: IArticle,
    value: any, // IEditor3ValueStorage
    config: IEditor3Config,
)
: {article: IArticle; stringValue: string; annotations: Array<any>} {
    const rawContentState = value.rawContentState;

    const {stringValue, annotations} = computeEditor3Output(
        rawContentState,
        config,
        article.language,
    );

    const articleUpdated: IArticle = {
        ...article,
        fields_meta: {
            ...(article.fields_meta ?? {}),
            [fieldId]: {
                draftjsState: [rawContentState],
            },
        },
    };

    if (annotations.length > 0) {
        articleUpdated.fields_meta[fieldId].annotations = annotations;
    }

    return {article: articleUpdated, stringValue, annotations};
}

/**
 * Converts existing hardcoded fields(slugline, priority, etc.) and {@link IOldCustomFieldId}
 * to {@link IAuthoringFieldV2}
 */
export function getFieldsAdapter(authoringStorage: IAuthoringStorage<IArticle>): IFieldsAdapter<IArticle> {
    const customFieldVocabularies = getCustomFieldVocabularies();
    const adapter: IFieldsAdapter<IArticle> = getBaseFieldsAdapter();

    for (const vocabulary of customFieldVocabularies) {
        if (vocabulary.field_type === 'text') {
            const fieldId = vocabulary._id;

            adapter[fieldId] = {
                getFieldV2: (fieldEditor, fieldSchema) => {
                    const fieldConfig: IEditor3Config = {
                        editorFormat: fieldEditor.formatOptions ?? [],
                        minLength: fieldSchema?.minlength,
                        maxLength: fieldSchema?.maxlength,
                        cleanPastedHtml: fieldEditor?.cleanPastedHTML,
                        singleLine: vocabulary.field_options?.single,
                        disallowedCharacters: [],
                    };

                    const fieldV2: IAuthoringFieldV2 = {
                        id: fieldId,
                        name: vocabulary.display_name,
                        fieldType: 'editor3',
                        fieldConfig,
                    };

                    return fieldV2;
                },
                retrieveStoredValue: (item: IArticle) => retrieveStoredValueEditor3Generic(
                    fieldId,
                    item,
                    authoringStorage,
                ),
                storeValue: (value, article, config) => storeEditor3ValueGeneric(
                    fieldId,
                    value as IEditor3ValueStorage,
                    article,
                    config,
                ),
            };
        } else if (vocabulary.field_type === 'date') {
            adapter[vocabulary._id] = {
                getFieldV2: (fieldEditor, fieldSchema) => {
                    const fieldConfig: IDateFieldConfig = {
                        shortcuts: vocabulary.date_shortcuts.map(({label, value, term}) => {
                            return {
                                label,
                                value,
                                term: term as IDateShortcut['term'],
                            };
                        }),
                    };

                    const fieldV2: IAuthoringFieldV2 = {
                        id: vocabulary._id,
                        name: vocabulary.display_name,
                        fieldType: 'date',
                        fieldConfig,
                    };

                    return fieldV2;
                },
            };
        } else if (vocabulary.field_type === 'urls') {
            adapter[vocabulary._id] = {
                getFieldV2: (fieldEditor, fieldSchema) => {
                    const fieldConfig: IUrlsFieldConfig = {};

                    const fieldV2: IAuthoringFieldV2 = {
                        id: vocabulary._id,
                        name: vocabulary.display_name,
                        fieldType: 'urls',
                        fieldConfig,
                    };

                    return fieldV2;
                },
            };
        } else if (vocabulary.field_type === 'embed') {
            adapter[vocabulary._id] = {
                getFieldV2: (fieldEditor, fieldSchema) => {
                    const fieldConfig: IEmbedConfig = {};

                    const fieldV2: IAuthoringFieldV2 = {
                        id: vocabulary._id,
                        name: vocabulary.display_name,
                        fieldType: 'embed',
                        fieldConfig,
                    };

                    return fieldV2;
                },
            };
        } else if (vocabulary.field_type === 'media') {
            adapter[vocabulary._id] = {
                getFieldV2: (fieldEditor, fieldSchema) => {
                    const fieldConfig: IMediaConfig = {
                        maxItems:
                            vocabulary.field_options?.multiple_items?.enabled === true
                                ? vocabulary.field_options.multiple_items.max_items
                                : 1,
                        allowPicture: vocabulary.field_options?.allowed_types?.picture === true,
                        allowAudio: vocabulary.field_options?.allowed_types?.audio === true,
                        allowVideo: vocabulary.field_options?.allowed_types?.video === true,
                        showPictureCrops: false,
                        showTitleEditingInput: false,
                        allowedWorkflows: {
                            inProgress:
                                vocabulary.field_options?.allowed_workflows?.in_progress
                                    ?? defaultAllowedWorkflows.in_progress,
                            published:
                                vocabulary.field_options?.allowed_workflows?.published
                                    ?? defaultAllowedWorkflows.published,
                        },
                    };

                    const fieldV2: IAuthoringFieldV2 = {
                        id: vocabulary._id,
                        name: vocabulary.display_name,
                        fieldType: 'media',
                        fieldConfig,
                    };

                    return fieldV2;
                },

                retrieveStoredValue: (item): IMediaValueOperational => {
                    return getRelatedMedia(item.associations, vocabulary._id);
                },

                storeValue: (val: IMediaValueOperational, article) => {
                    return applyAssociations(article, val, vocabulary._id);
                },
            };
        } else if (vocabulary.field_type === 'related_content') {
            adapter[vocabulary._id] = {
                getFieldV2: (fieldEditor, fieldSchema) => {
                    const fieldConfig: ILinkedItemsConfig = {};

                    const fieldV2: IAuthoringFieldV2 = {
                        id: vocabulary._id,
                        name: vocabulary.display_name,
                        fieldType: LINKED_ITEMS_FIELD_TYPE,
                        fieldConfig,
                    };

                    return fieldV2;
                },

                retrieveStoredValue: (item): ILinkedItemsValueOperational => {
                    return getRelatedArticles(item.associations, vocabulary._id)
                        .map(({_id, type}) => ({id: _id, type}));
                },

                storeValue: (val: ILinkedItemsValueOperational, article) => {
                    const relatedItems: Array<IRelatedArticle> = val.map(({id, type}, i) => ({
                        _id: id,
                        type: type,
                        order: i,
                    }));

                    return applyAssociations(article, relatedItems, vocabulary._id);
                },
            };
        }
    }

    sdApi.vocabularies.getAll()
        .filter((vocabulary) =>
            adapter[vocabulary._id] == null
            && sdApi.vocabularies.isSelectionVocabulary(vocabulary),
        )
        .forEach((vocabulary) => {
            const multiple = vocabulary.selection_type === 'multi selection';

            adapter[vocabulary._id] = {
                getFieldV2: (fieldEditor, fieldSchema) => {
                    const fieldConfig: IDropdownConfigVocabulary = {
                        source: 'vocabulary',
                        vocabularyId: vocabulary._id,
                        multiple: multiple,
                    };

                    const fieldV2: IAuthoringFieldV2 = {
                        id: vocabulary._id,
                        name: vocabulary.display_name,
                        fieldType: 'dropdown',
                        fieldConfig,
                    };

                    return fieldV2;
                },
                retrieveStoredValue: (article): Array<string> | string => {
                    const values = (article.subject ?? [])
                        .filter(({scheme}) => scheme === vocabulary._id)
                        .map(({qcode}) => {
                            return qcode;
                        });

                    if (multiple) {
                        return values;
                    } else {
                        return values[0];
                    }
                },
                storeValue: (val: string | Array<string>, article) => {
                    interface IStorageFormat {
                        qcode: string;
                        name: string;
                        parent?: string;
                        scheme: string;
                    }

                    const qcodes = new Set((() => {
                        if (val == null) {
                            return [];
                        } else if (Array.isArray(val)) {
                            return val;
                        } else {
                            return [val];
                        }
                    })());

                    const vocabularyItems = vocabulary.items.filter(
                        (_voc) => qcodes.has(_voc.qcode),
                    );

                    return {
                        ...article,
                        subject:
                        (article.subject ?? [])
                            .filter(({scheme}) => scheme !== vocabulary._id)
                            .concat(
                                vocabularyItems.map(({qcode, name, parent}) => {
                                    var itemToStore: IStorageFormat = {
                                        qcode: qcode,
                                        name: name,
                                        scheme: vocabulary._id,
                                    };

                                    if (parent != null) {
                                        itemToStore.parent = parent;
                                    }

                                    return itemToStore;
                                }),
                            ),
                    };
                },
            };
        });

    return adapter;
}
