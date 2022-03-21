import {IArticle, IAuthoringFieldV2, IVocabulary, IVocabularyItem} from 'superdesk-api';
import {Map} from 'immutable';
import {IDropdownDataCustom, IDropdownDataVocabulary} from './dropdown';
import {IEditor3Config} from './editor3/interfaces';
import {appConfig} from 'appConfig';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';
import {IOldCustomFieldId} from '../interfaces';

interface IFieldAdapter {
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
        priority: {
            getFieldV2: (fieldEditor, fieldSchema) => {
                const vocabulary = ng.get('vocabularies').getVocabularySync('priority');

                // HAS TO BE SYNCED WITH styles/sass/labels.scss
                var defaultPriorityColors = {
                    0: '#cccccc',
                    1: '#b82f00',
                    2: '#de6237',
                    3: '#e49c56',
                    4: '#edc175',
                    5: '#b6c28b',
                    6: '#c0c9a1',
                };

                const fieldConfig: IDropdownDataCustom = {
                    source: 'manual-entry',
                    readOnly: fieldEditor.readonly,
                    required: fieldEditor.required,
                    type: 'number',
                    options: vocabulary.items.map(({name, qcode, color}) => {
                        const option: IDropdownDataCustom['options'][0] = {
                            id: qcode,
                            label: name,
                            color: color ?? defaultPriorityColors[name] ?? undefined,
                        };

                        return option;
                    }),
                    roundCorners: false,
                    multiple: false,
                };

                const fieldV2: IAuthoringFieldV2 = {
                    id: 'priority',
                    name: gettext('Priority'),
                    fieldType: 'dropdown',
                    fieldConfig,
                };

                return fieldV2;
            },
        },
        urgency: {
            getFieldV2: (fieldEditor, fieldSchema) => {
                const vocabulary = ng.get('vocabularies').getVocabularySync('urgency');

                // HAS TO BE SYNCED WITH styles/sass/labels.scss
                var defaultUrgencyColors = {
                    0: '#cccccc',
                    1: '#01405b',
                    2: '#005e84',
                    3: '#3684a4',
                    4: '#64a4bf',
                    5: '#a1c6d8',
                };

                const fieldConfig: IDropdownDataCustom = {
                    source: 'manual-entry',
                    readOnly: fieldEditor.readonly,
                    required: fieldEditor.required,
                    type: 'number',
                    options: vocabulary.items.map(({name, qcode, color}) => {
                        const option: IDropdownDataCustom['options'][0] = {
                            id: qcode,
                            label: name,
                            color: color ?? defaultUrgencyColors[name] ?? undefined,
                        };

                        return option;
                    }),
                    roundCorners: true,
                    multiple: false,
                };

                const fieldV2: IAuthoringFieldV2 = {
                    id: 'urgency',
                    name: gettext('Urgency'),
                    fieldType: 'dropdown',
                    fieldConfig,
                };

                return fieldV2;
            },
        },
        slugline: {
            getFieldV2: (fieldEditor, fieldSchema) => {
                const fieldConfig: IEditor3Config = {
                    readOnly: fieldEditor.readonly,
                    required: fieldEditor.required,
                    editorFormat: [],
                    minLength: fieldSchema?.minlength,
                    maxLength: fieldSchema?.maxlength,
                    cleanPastedHtml: fieldEditor?.cleanPastedHTML,
                    singleLine: true,
                    disallowedCharacters: appConfig.disallowed_characters ?? [],
                };

                const fieldV2: IAuthoringFieldV2 = {
                    id: 'slugline',
                    name: gettext('Slugline'),
                    fieldType: 'editor3',
                    fieldConfig,
                };

                return fieldV2;
            },
        },
        body_html: {
            getFieldV2: (fieldEditor, fieldSchema) => {
                const fieldConfig: IEditor3Config = {
                    readOnly: fieldEditor.readonly,
                    required: fieldEditor.required,
                    editorFormat: fieldEditor.formatOptions ?? [],
                    minLength: fieldSchema?.minlength,
                    maxLength: fieldSchema?.maxlength,
                    cleanPastedHtml: fieldEditor?.cleanPastedHTML,
                    singleLine: false,
                    disallowedCharacters: [],
                };

                const fieldV2: IAuthoringFieldV2 = {
                    id: 'body_html',
                    name: gettext('Body HTML'),
                    fieldType: 'editor3',
                    fieldConfig,
                };

                return fieldV2;
            },
        },
        language: {
            getFieldV2: (fieldEditor, fieldSchema) => {
                const fieldConfig: IDropdownDataVocabulary = {
                    readOnly: fieldEditor.readonly,
                    required: fieldEditor.required,
                    source: 'vocabulary',
                    vocabularyId: 'languages',
                    multiple: false,
                };

                const fieldV2: IAuthoringFieldV2 = {
                    id: 'language',
                    name: gettext('Language'),
                    fieldType: 'dropdown',
                    fieldConfig,
                };

                return fieldV2;
            },
        },
        genre: {
            // TODO: it should work to select multiple values
            getFieldV2: (fieldEditor, fieldSchema) => {
                const fieldConfig: IDropdownDataVocabulary = {
                    readOnly: fieldEditor.readonly,
                    required: fieldEditor.required,
                    source: 'vocabulary',
                    vocabularyId: 'genre',
                    multiple: true,
                };

                const fieldV2: IAuthoringFieldV2 = {
                    id: 'genre',
                    name: gettext('Genre'),
                    fieldType: 'dropdown',
                    fieldConfig,
                };

                return fieldV2;
            },
            getSavedData: (article) => {
                return article.genre.map(({qcode}) => qcode);
            },
            saveData: (values: Array<string>, article) => {
                const vocabulary: IVocabulary = ng.get('vocabularies').getVocabularySync('genre');
                const vocabularyItems = Map<IVocabularyItem['qcode'], IVocabularyItem>(
                    vocabulary.items.map((item) => [item.qcode, item]),
                );

                return {
                    ...article,
                    genre: values.map((qcode) => ({qcode, name: vocabularyItems.get(qcode)?.name ?? ''})),
                };
            },
        },
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

    return adapter;
}
