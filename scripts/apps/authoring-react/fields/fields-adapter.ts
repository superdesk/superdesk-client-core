import {IAuthoringFieldV2, IVocabulary} from 'superdesk-api';
import {IDropdownConfig} from './dropdown';
import {IEditor3Config} from './editor3/interfaces';
import {appConfig} from 'appConfig';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';
import {IOldCustomFieldId} from '../interfaces';

type IFieldsAdapter = {[key: string]: (editor, schema) => IAuthoringFieldV2};

/**
 * Converts existing hardcoded fields(slugline, priority, etc.) and {@link IOldCustomFieldId}
 * to {@link IAuthoringFieldV2}
 */
export function getFieldsAdapter(customFieldVocabularies: Array<IVocabulary>): IFieldsAdapter {
    const adapter: IFieldsAdapter = {
        priority: (fieldEditor, fieldSchema) => {
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

            const fieldConfig: IDropdownConfig = {
                readOnly: fieldEditor.readonly,
                required: fieldEditor.required,
                type: 'number',
                options: vocabulary.items.map(({name, qcode, color}) => {
                    const option: IDropdownConfig['options'][0] = {
                        id: qcode,
                        label: name,
                        color: color ?? defaultPriorityColors[name] ?? undefined,
                    };

                    return option;
                }),
                roundCorners: false,
            };

            const fieldV2: IAuthoringFieldV2 = {
                id: 'priority',
                name: gettext('Priority'),
                fieldType: 'dropdown',
                fieldConfig,
            };

            return fieldV2;
        },
        urgency: (fieldEditor, fieldSchema) => {
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

            const fieldConfig: IDropdownConfig = {
                readOnly: fieldEditor.readonly,
                required: fieldEditor.required,
                type: 'number',
                options: vocabulary.items.map(({name, qcode, color}) => {
                    const option: IDropdownConfig['options'][0] = {
                        id: qcode,
                        label: name,
                        color: color ?? defaultUrgencyColors[name] ?? undefined,
                    };

                    return option;
                }),
                roundCorners: true,
            };

            const fieldV2: IAuthoringFieldV2 = {
                id: 'urgency',
                name: gettext('Urgency'),
                fieldType: 'dropdown',
                fieldConfig,
            };

            return fieldV2;
        },
        slugline: (fieldEditor, fieldSchema) => {
            const fieldConfig: IEditor3Config = {
                readOnly: fieldEditor.readonly,
                required: fieldEditor.required,
                editorFormat: [],
                minLength: fieldSchema?.minlength,
                maxLength: fieldSchema?.maxlength,
                cleanPastedHtml: fieldSchema?.cleanPastedHTML,
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
    };

    for (const vocabulary of customFieldVocabularies) {
        if (vocabulary.field_type === 'text') {
            adapter[vocabulary._id] = (fieldEditor, fieldSchema) => {
                const fieldConfig: IEditor3Config = {
                    readOnly: fieldEditor.readonly,
                    required: fieldEditor.required,
                    editorFormat: fieldEditor.formatOptions ?? [],
                    minLength: fieldSchema?.minlength,
                    maxLength: fieldSchema?.maxlength,
                    cleanPastedHtml: fieldSchema?.cleanPastedHTML,
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
            };
        }
    }

    return adapter;
}
