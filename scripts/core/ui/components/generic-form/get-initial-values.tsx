import {assertNever} from 'core/helpers/typescript-helpers';
import {isIFormGroup, isIFormField, GenericFormFieldType} from './interfaces/form';
import {IFormField, IFormFieldAlert, IFormGroup} from 'superdesk-api';

function getInitialValueForFieldType<T extends object>(fieldConfig: IFormField<T>): {readonly [field: string]: any} {
    const {field} = fieldConfig;

    // Fallback to default
    if (fieldConfig.defaultValue !== undefined) {
        return {[field]: fieldConfig.defaultValue};
    }

    const type: GenericFormFieldType = fieldConfig.type;

    switch (type) {
        case GenericFormFieldType.plainText:
        case GenericFormFieldType.textEditor3:
            return {[field]: ''};
        case GenericFormFieldType.vocabularySingleValue:
        case GenericFormFieldType.contentFilterSingleValue:
        case GenericFormFieldType.deskSingleValue:
        case GenericFormFieldType.stageSingleValue:
        case GenericFormFieldType.macroSingleValue:
        case GenericFormFieldType.yesNo:
        case GenericFormFieldType.select:
        case GenericFormFieldType.selectMultiple:
        case GenericFormFieldType.readonlyCopyableText:
        case GenericFormFieldType.number:
        case GenericFormFieldType.duration:
            return {[field]: undefined};
        case GenericFormFieldType.checkbox:
            return {[field]: false};
        case GenericFormFieldType.alert:
            return {[field]: (fieldConfig as IFormFieldAlert<T>).value};
        default:
            assertNever(type);
    }
}

function getInitialValuesForForm<T extends object>(
    form: Array<IFormField<T> | IFormGroup<T>>,
): {readonly [field: string]: any} {
    return form.map((item) => {
        if (isIFormGroup(item)) {
            return getInitialValues(item);
        } else if (isIFormField(item)) {
            return getInitialValueForFieldType(item);
        } else {
            return assertNever(item);
        }
    })
        .reduce((accumulator, item) => ({...accumulator, ...item}), {});
}

// Some fields need to be initialized automatically.
// For example `false` needs to be sent to the server by default in case of checkbox
// and not `undefined` which might be sent without initialization.
export function getInitialValues<T extends object>(group: IFormGroup<T>): {readonly [key: string]: any} {
    return getInitialValuesForForm(group.form);
}
