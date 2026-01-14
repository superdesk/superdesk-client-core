import {assertNever} from 'core/helpers/typescript-helpers';
import {GenericFormFieldType} from './interfaces/form';
import {IFormField} from 'superdesk-api';
import {stripHtmlTags} from 'core/utils';

export function hasValue<T extends object>(fieldConfig: IFormField<T>, value: any): boolean {
    const type: GenericFormFieldType = fieldConfig.type;

    switch (type) {
        case GenericFormFieldType.alert:
        case GenericFormFieldType.readonlyCopyableText:
        case GenericFormFieldType.plainText:
            return typeof value === 'string' && value.trim().length > 0;

        case GenericFormFieldType.number:
        case GenericFormFieldType.duration:
            return typeof value === 'number';

        case GenericFormFieldType.textEditor3:
            return typeof value === 'string' && value.trim().length > 0 && stripHtmlTags(value).trim().length > 0;

        case GenericFormFieldType.vocabularySingleValue:
        case GenericFormFieldType.contentFilterSingleValue:
        case GenericFormFieldType.deskSingleValue:
        case GenericFormFieldType.stageSingleValue:
        case GenericFormFieldType.macroSingleValue:
        case GenericFormFieldType.select:
            return typeof value === 'string' && value.trim().length > 0;

        case GenericFormFieldType.selectMultiple:
            return Array.isArray(value) && value.length > 0;

        case GenericFormFieldType.yesNo:
            return value === 'true' || value === 'false';

        case GenericFormFieldType.checkbox:
            return value === true || value === false;

        default:
            assertNever(type);
    }
}
