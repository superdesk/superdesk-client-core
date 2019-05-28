import {ISuperdesk, IFormField} from 'superdesk-api';

export function getFields(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const {FormFieldType} = superdesk.forms;

    const nameField: IFormField = {
        label: gettext('Name'),
        type: FormFieldType.textSingleLine,
        field: 'name',
        required: true,
    };
    const languageField: IFormField = {
        label: gettext('Language'),
        type: FormFieldType.vocabularySingleValue,
        field: 'language',
        component_parameters: {
            vocabulary_id: 'languages',
        },
        required: true,
    };
    const definitionField: IFormField = {
        label: gettext('Definition'),
        type: FormFieldType.textEditor3,
        field: 'definition_html',
        required: true,
    };

    return {
        nameField,
        languageField,
        definitionField,
    };
}
