import * as React from 'react';
import {
    IArticle,
    IAuthor,
    IAuthoringFieldV2,
    IRestApiResponse,
    IUser,
    IVocabulary,
    IVocabularyItem,
} from 'superdesk-api';
import {Map} from 'immutable';
import {
    IDropdownConfigManualSource,
    IDropdownConfigRemoteSource,
    IDropdownConfigVocabulary,
    IDropdownTreeConfig,
    IDropdownValue,
} from './dropdown';
import {IEditor3Config} from './editor3/interfaces';
import {appConfig} from 'appConfig';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';
import {IOldCustomFieldId} from '../interfaces';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {IGeoName} from 'apps/authoring/metadata/PlacesService';
import {ITreeWithLookup} from 'core/ui/components/MultiSelectTreeWithTemplate';
import {getVocabularySelectionTypes} from 'apps/vocabularies/constants';
import {arrayToTree} from 'core/helpers/tree';

interface IFieldAdapter {
    getFieldV2: (
        fieldEditor,
        fieldSchema,
    ) => IAuthoringFieldV2;

    saveData?<T extends Partial<IArticle>>(value: unknown, item: T): T;
    getSavedData?<T extends Partial<IArticle>>(item: T): unknown;
}

type IFieldsAdapter = {[key: string]: IFieldAdapter};

function isMultiple(vocabularyId): boolean {
    const vocabulary: IVocabulary = ng.get('vocabularies').getVocabularySync(vocabularyId);

    return vocabulary?.service?.all === 1;
}

function isMultipleV2(vocabularyId) {
    const vocabulary: IVocabulary = ng.get('vocabularies').getVocabularySync(vocabularyId);

    const isSingle = vocabulary.selection_type === getVocabularySelectionTypes().SINGLE_SELECTION.id;
    const _isMultiple = !isSingle;

    return _isMultiple;
}

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

                const fieldConfig: IDropdownConfigManualSource = {
                    source: 'manual-entry',
                    readOnly: fieldEditor.readonly,
                    required: fieldEditor.required,
                    type: 'number',
                    options: vocabulary.items.map(({name, qcode, color}) => {
                        const option: IDropdownConfigManualSource['options'][0] = {
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

                const fieldConfig: IDropdownConfigManualSource = {
                    source: 'manual-entry',
                    readOnly: fieldEditor.readonly,
                    required: fieldEditor.required,
                    type: 'number',
                    options: vocabulary.items.map(({name, qcode, color}) => {
                        const option: IDropdownConfigManualSource['options'][0] = {
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
                const fieldConfig: IDropdownConfigVocabulary = {
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
            getFieldV2: (fieldEditor, fieldSchema) => {
                const multiple = isMultiple('genre');

                const fieldConfig: IDropdownConfigVocabulary = {
                    readOnly: fieldEditor.readonly,
                    required: fieldEditor.required,
                    source: 'vocabulary',
                    vocabularyId: 'genre',
                    multiple: multiple,
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
                const multiple = isMultiple('genre');

                if (multiple) {
                    return article.genre.map(({qcode}) => qcode);
                } else {
                    return article.genre.map(({qcode}) => qcode)[0];
                }
            },
            saveData: (val: IDropdownValue, article) => {
                const vocabulary: IVocabulary = ng.get('vocabularies').getVocabularySync('genre');
                const vocabularyItems = Map<IVocabularyItem['qcode'], IVocabularyItem>(
                    vocabulary.items.map((item) => [item.qcode, item]),
                );

                if (Array.isArray(val)) {
                    return {
                        ...article,
                        genre: val.map((qcode) => ({qcode, name: vocabularyItems.get(qcode.toString())?.name ?? ''})),
                    };
                } else {
                    const qcode = val;

                    return {
                        ...article,
                        genre: [{qcode, name: vocabularyItems.get(qcode.toString())?.name ?? ''}],
                    };
                }
            },
        },
        place: (() => {
            const useGeoNamesApi = ng.get('features').places_autocomplete;

            if (useGeoNamesApi) {
                return {
                    getFieldV2: (fieldEditor, fieldSchema) => {
                        const fieldConfig: IDropdownConfigRemoteSource = {
                            readOnly: fieldEditor.readonly,
                            required: fieldEditor.required,
                            source: 'remote-source',
                            searchOptions: (searchTerm, language, callback) => {
                                httpRequestJsonLocal<IRestApiResponse<IGeoName>>({
                                    method: 'GET',
                                    path: '/places_autocomplete',
                                    urlParams: {
                                        lang: language,
                                        name: searchTerm,
                                    },
                                }).then((res) => {
                                    const tree: ITreeWithLookup<IGeoName> = {
                                        nodes: res._items.map((item) => ({value: item})),
                                        lookup: {},
                                    };

                                    callback(tree);
                                });
                            },
                            getId: (option: IGeoName) => option.code,
                            getLabel: (option: IGeoName) => option.name,
                            multiple: true,
                        };

                        const fieldV2: IAuthoringFieldV2 = {
                            id: 'place',
                            name: gettext('Place'),
                            fieldType: 'dropdown',
                            fieldConfig,
                        };

                        return fieldV2;
                    },
                    getSavedData: (article) => {
                        return article.place;
                    },
                    saveData: (val: IDropdownValue, article) => {
                        return {
                            ...article,
                            place: val,
                        };
                    },
                };
            } else { // use "locators" vocabulary
                return {
                    getFieldV2: (fieldEditor, fieldSchema) => {
                        const multiple = isMultipleV2('locators');

                        const fieldConfig: IDropdownConfigVocabulary = {
                            readOnly: fieldEditor.readonly,
                            required: fieldEditor.required,
                            source: 'vocabulary',
                            vocabularyId: 'locators',
                            multiple: multiple,
                        };

                        const fieldV2: IAuthoringFieldV2 = {
                            id: 'place',
                            name: gettext('Place'),
                            fieldType: 'dropdown',
                            fieldConfig,
                        };

                        return fieldV2;
                    },
                    getSavedData: (article) => {
                        const multiple = isMultipleV2('locators');

                        if (multiple) {
                            return article.place.map(({qcode}) => qcode);
                        } else {
                            return article.place.map(({qcode}) => qcode)[0];
                        }
                    },
                    saveData: (val: IDropdownValue, article) => {
                        const vocabulary: IVocabulary = ng.get('vocabularies').getVocabularySync('locators');
                        const vocabularyItems = Map<IVocabularyItem['qcode'], IVocabularyItem>(
                            vocabulary.items.map((item) => [item.qcode, item]),
                        );

                        if (Array.isArray(val)) {
                            return {
                                ...article,
                                place: val.map(
                                    (qcode) => ({qcode, name: vocabularyItems.get(qcode.toString())?.name ?? ''}),
                                ),
                            };
                        } else {
                            const qcode = val;

                            return {
                                ...article,
                                place: [{qcode, name: vocabularyItems.get(qcode.toString())?.name ?? ''}],
                            };
                        }
                    },
                };
            }
        })(),
        authors: (() => {
            function valueTemplate({item}) {
                return (
                    <span>{item.name}: {item.sub_label}</span>
                );
            }

            const getId = (item) => typeof item._id === 'string' ? item._id : JSON.stringify(item._id);

            interface IUserOption {
                _id: IUser['_id'];
                name: string;
                user: IUser;
            }

            interface IAuthorRole extends IAuthor {
                parent: IUser['_id'];
            }

            function isAuthorRole(x: IUserOption | IAuthorRole): x is IAuthorRole {
                return Array.isArray(x._id);
            }

            return {
                getFieldV2: (fieldEditor, fieldSchema) => {
                    const fieldConfig: IDropdownTreeConfig = {
                        readOnly: fieldEditor.readonly,
                        required: fieldEditor.required,
                        getItems: () => {
                            const metadata = ng.get('metadata');

                            const authors = arrayToTree(
                                metadata.values.authors as Array<IUserOption | IAuthorRole>,
                                (item) => getId(item),
                                (item) => {
                                    if (isAuthorRole(item)) {
                                        return item.parent;
                                    } else {
                                        return null;
                                    }
                                },
                            );

                            return ({
                                nodes: authors.result,
                                lookup: {},
                            });
                        },
                        canSelectBranchWithChildren: () => false,
                        getLabel: (item: IUserOption | IAuthorRole) => item.name,
                        valueTemplate: valueTemplate,
                        getId: (item) => getId(item),
                        source: 'dropdown-tree',
                        multiple: true,
                    };

                    const fieldV2: IAuthoringFieldV2 = {
                        id: 'authors',
                        name: gettext('Authors'),
                        fieldType: 'dropdown',
                        fieldConfig,
                    };

                    return fieldV2;
                },
                getSavedData: (article) => {
                    return article.authors;
                },
                saveData: (val: IDropdownValue, article) => {
                    return {...article, authors: val};
                },
            };
        })(),
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
