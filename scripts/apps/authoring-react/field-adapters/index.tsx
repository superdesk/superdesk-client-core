import {
    IArticle,
    IAuthoringFieldV2,
    IVocabulary,
    IVocabularyItem,
} from 'superdesk-api';
import {IDropdownTreeConfig} from '../fields/dropdown';
import {IEditor3Config} from '../fields/editor3/interfaces';
import {arrayToTree} from 'core/helpers/tree';
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

export interface IFieldAdapter {
    getFieldV2: (
        fieldEditor,
        fieldSchema,
    ) => IAuthoringFieldV2;

    saveData?<T extends Partial<IArticle>>(value: unknown, item: T): T;
    getSavedData?<T extends Partial<IArticle>>(item: T): unknown;
}

type IFieldsAdapter = {[key: string]: IFieldAdapter};

/**
 * Converts existing hardcoded fields(slugline, priority, etc.) and {@link IOldCustomFieldId}
 * to {@link IAuthoringFieldV2}
 */
export function getFieldsAdapter(customFieldVocabularies: Array<IVocabulary>): IFieldsAdapter {
    const adapter: IFieldsAdapter = {
        authors: authors,
        body_html: body_html,
        genre: genre,
        language: language,
        place: getPlaceAdapter(),
        priority: priority,
        slugline: slugline,
        subject: getSubjectAdapter(),
        urgency: urgency,
    };

    for (const vocabulary of customFieldVocabularies) {
        if (vocabulary.field_type === 'text') {
            adapter[vocabulary._id] = {
                getFieldV2: (fieldEditor, fieldSchema) => {
                    const fieldConfig: IEditor3Config = {
                        readOnly: fieldEditor.readonly,
                        required: fieldEditor.required,
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
        }
    }

    const customVocabularyIds = new Set(customFieldVocabularies.map(({_id}) => _id));

    authoringStorage.getVocabularies().forEach((vocabulary) => {
        if (
            customVocabularyIds.has(vocabulary._id) !== true
            && (
                vocabulary.selection_type === 'multi selection'
                || vocabulary.selection_type === 'single selection'
            )
        ) {
            type IOperationalFormat = {qcode: string; name: string; parent?: string};

            adapter[vocabulary._id] = {
                getFieldV2: (fieldEditor, fieldSchema) => {
                    const fieldConfig: IDropdownTreeConfig = {
                        source: 'dropdown-tree',
                        readOnly: fieldEditor.readonly,
                        required: fieldEditor.required,
                        getItems: () => {
                            const items = arrayToTree(
                                vocabulary.items,
                                (item) => item.qcode,
                                (item) => item.parent ?? null,
                            );

                            return ({
                                nodes: items.result,
                                lookup: {},
                            });
                        },
                        getLabel: (item: IVocabularyItem) => item.name,
                        getId: (item: IVocabularyItem) => item.qcode,
                        canSelectBranchWithChildren: () => false,
                        multiple: vocabulary.selection_type === 'multi selection',
                    };

                    const fieldV2: IAuthoringFieldV2 = {
                        id: vocabulary._id,
                        name: vocabulary.display_name,
                        fieldType: 'dropdown',
                        fieldConfig,
                    };

                    return fieldV2;
                },
                getSavedData: (article): Array<IOperationalFormat> => {
                    return (article.subject ?? [])
                        .filter(({scheme}) => scheme === vocabulary._id)
                        .map(({qcode, name, parent}) => ({qcode, name, parent}));
                },
                saveData: (val: Array<IOperationalFormat>, article) => {
                    interface IStorageFormat {
                        qcode: string;
                        name: string;
                        parent?: string;
                        scheme: string;
                    }

                    return {
                        ...article,
                        subject: (article.subject ?? []).concat(
                            val.map(({qcode, name, parent}) => {
                                var itemToStore: IStorageFormat = {qcode, name, scheme: vocabulary._id};

                                if (parent != null) {
                                    itemToStore.parent = parent;
                                }

                                return itemToStore;
                            }),
                        ),
                    };
                },
            };
        }
    });

    return adapter;
}
