import {assertNever} from 'core/helpers/typescript-helpers';
import {IFormField, IFormGroup, isIFormGroup, isIFormField, FormFieldType} from './interfaces/form';

function getInitialValueForFieldType(fieldConfig: IFormField): {readonly [field: string]: any} {
    const {type, field} = fieldConfig;

    switch (type) {
    case FormFieldType.textSingleLine:
    case FormFieldType.textEditor3:
        return {[field]: ''};
    case FormFieldType.vocabularySingleValue:
    case FormFieldType.contentFilterSingleValue:
    case FormFieldType.deskSingleValue:
    case FormFieldType.stageSingleValue:
    case FormFieldType.macroSingleValue:
    case FormFieldType.yesNo:
        return {[field]: undefined};
    case FormFieldType.checkbox:
        return {[field]: false};
    default:
        assertNever(type);
    }
}

function getInitialValuesForForm(form: Array<IFormField | IFormGroup>): {readonly [field: string]: any} {
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
export function getInitialValues(group: IFormGroup): {readonly [key: string]: any} {
    return getInitialValuesForForm(group.form);
}
