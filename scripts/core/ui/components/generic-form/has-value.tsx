import {FormFieldType} from './interfaces/form';
import {IFormField} from 'superdesk-api';
import {assertNever} from 'core/helpers/typescript-helpers';

export function hasValue(fieldConfig: IFormField, value: any): boolean {
    const type: FormFieldType = fieldConfig.type;

    switch (type) {
    case FormFieldType.textSingleLine:
    case FormFieldType.textEditor3:
        return typeof value === 'string' && value.trim().length > 0;
    case FormFieldType.vocabularySingleValue:
    case FormFieldType.contentFilterSingleValue:
    case FormFieldType.deskSingleValue:
    case FormFieldType.stageSingleValue:
    case FormFieldType.macroSingleValue:
    case FormFieldType.yesNo:
    case FormFieldType.select:
    case FormFieldType.selectMultiple:
    case FormFieldType.number:
    case FormFieldType.checkbox:
        return typeof value !== 'undefined';
    default:
        assertNever(type);
    }
}
