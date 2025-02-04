import {assertNever} from 'core/helpers/typescript-helpers';
import {isIFormGroup, isIFormField, FormFieldType} from './interfaces/form';
import {IFormField, IFormGroup} from 'superdesk-api';
import {stripHtmlTags} from 'core/utils';

export function hasValue(fieldConfig: IFormField, value: any): boolean {
    const type: FormFieldType = fieldConfig.type;

    switch (type) {
    case FormFieldType.plainText:
        return typeof value === 'string' && value.trim().length > 0;

    case FormFieldType.number:
    case FormFieldType.duration:
        return typeof value === 'number';

    case FormFieldType.textEditor3:
        return typeof value === 'string' && value.trim().length > 0 && stripHtmlTags(value).trim().length > 0;

    case FormFieldType.vocabularySingleValue:
    case FormFieldType.contentFilterSingleValue:
    case FormFieldType.deskSingleValue:
    case FormFieldType.stageSingleValue:
    case FormFieldType.macroSingleValue:
    case FormFieldType.select:
        return typeof value === 'string' && value.trim().length > 0;

    case FormFieldType.selectMultiple:
        return Array.isArray(value) && value.length > 0;

    case FormFieldType.yesNo:
        return value === 'true' || value === 'false';

    case FormFieldType.checkbox:
        return value === true || value === false;

    default:
        assertNever(type);
    }
}
