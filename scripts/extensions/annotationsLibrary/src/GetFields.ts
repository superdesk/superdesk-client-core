import {ISuperdesk, IFormField} from 'superdesk-api';
import {IKnowledgeBaseItem} from './interfaces';

export function getFields(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const {GenericFormFieldType} = superdesk.forms;

    const nameField: IFormField<IKnowledgeBaseItem> = {
        label: gettext('Name'),
        type: GenericFormFieldType.plainText,
        field: 'name',
        required: true,
    };
    const languageField: IFormField<IKnowledgeBaseItem> = {
        label: gettext('Language'),
        type: GenericFormFieldType.vocabularySingleValue,
        field: 'language',
        component_parameters: {
            vocabulary_id: 'languages',
        },
        required: true,
    };
    const definitionField: IFormField<IKnowledgeBaseItem> = {
        label: gettext('Definition'),
        type: GenericFormFieldType.textEditor3,
        field: 'definition_html',
        required: true,
    };

    return {
        nameField,
        languageField,
        definitionField,
    };
}
