import {
    IArticle,
    IAuthoringFieldV2,
    ICustomFieldType,
} from 'superdesk-api';
import {IDropdownConfigVocabulary} from '../fields/dropdown';
import {IEditor3Config} from '../fields/editor3/interfaces';
import {authoringStorage} from '../data-layer';
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
import {IDateFieldConfig, IDateShortcut} from '../fields/date/interfaces';
import {IUrlsFieldConfig} from '../fields/urls/interfaces';
import {IEmbedConfig} from '../fields/embed/interfaces';
import {feature_media} from './feature_media';
import {IMediaConfig, IMediaValueOperational} from '../fields/media/interfaces';
import {applyAssociations, getRelatedMedia} from 'apps/authoring/authoring/controllers/AssociationController';
import {defaultAllowedWorkflows} from 'apps/relations/services/RelationsService';

export interface IFieldAdapter {
    getFieldV2: (
        fieldEditor,
        fieldSchema,
    ) => IAuthoringFieldV2;

    /**
     * If defined, {@link ICustomFieldType.storeValue} will not be used
     */
    storeValue?(value: unknown, article: IArticle, config: unknown): IArticle;

    /**
     * If defined, {@link ICustomFieldType.retrieveStoredValue} will not be used
     */
    retrieveStoredValue?(item: IArticle): unknown;

    /**
     * Must return a value in operational format.
     */
    onToggledOn?: ICustomFieldType<unknown, unknown, unknown, unknown>['onToggledOn'];
}

type IFieldsAdapter = {[key: string]: IFieldAdapter};

export function getBaseFieldsAdapter(): IFieldsAdapter {
    const adapter: IFieldsAdapter = {
        abstract: abstract,
        anpa_category: anpa_category,
        anpa_take_key: anpa_take_key,
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
    };

    return adapter;
}

/**
 * Converts existing hardcoded fields(slugline, priority, etc.) and {@link IOldCustomFieldId}
 * to {@link IAuthoringFieldV2}
 */
export function getFieldsAdapter(): IFieldsAdapter {
    const customFieldVocabularies = getCustomFieldVocabularies();
    const adapter: IFieldsAdapter = getBaseFieldsAdapter();

    for (const vocabulary of customFieldVocabularies) {
        if (vocabulary.field_type === 'text') {
            adapter[vocabulary._id] = {
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
                        id: vocabulary._id,
                        name: vocabulary.display_name,
                        fieldType: 'editor3',
                        fieldConfig,
                    };

                    return fieldV2;
                },
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
        }
    }

    authoringStorage.getVocabularies()
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
