import {assertNever} from 'core/helpers/typescript-helpers';
import {isIFormGroup, isIFormField, FormFieldType} from './interfaces/form';
import {IFormField, IFormGroup} from 'superdesk-api';
import {stripHtmlTags} from 'core/utils';

export function hasValue(fieldConfig: IFormField, value: any): boolean {
    const type: FormFieldType = fieldConfig.type;

    switch (type) {
    case FormFieldType.textSingleLine:
        return typeof value === 'string' && value.trim().length > 0;

    case FormFieldType.textEditor3:
        return typeof value === 'string' && value.trim().length > 0 && stripHtmlTags(value).trim().length > 0;

    case FormFieldType.vocabularySingleValue:
    case FormFieldType.contentFilterSingleValue:
    case FormFieldType.deskSingleValue:
    case FormFieldType.stageSingleValue:
    case FormFieldType.macroSingleValue:
        return typeof value === 'string' && value.trim().length > 0;

    case FormFieldType.yesNo:
        return value === 'true' || value === 'false';

    case FormFieldType.select:
        return value != null && value !== '';

    case FormFieldType.checkbox:
        return value === true || value === false;

    default:
        assertNever(type);
    }
}
