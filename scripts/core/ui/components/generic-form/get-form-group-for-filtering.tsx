import {assertNever} from 'core/helpers/typescript-helpers';
import {IFormField, IFormGroup, isIFormGroup, isIFormField, FormFieldType} from './interfaces/form';

// different components must be used for filtering than for entering/updating items
function getFieldTypeForFiltering(type: IFormField['type']): IFormField['type'] {
    switch (type) {
    case FormFieldType.textSingleLine:
        return FormFieldType.textSingleLine;
    case FormFieldType.textEditor3:
        // even though textEditor3 outputs HTML, plaintext has to be used for filtering
        return FormFieldType.textSingleLine;
    case FormFieldType.vocabularySingleValue:
        return FormFieldType.vocabularySingleValue;
    case FormFieldType.checkbox:
        return FormFieldType.yesNo;
    case FormFieldType.contentFilterSingleValue:
        return FormFieldType.contentFilterSingleValue;
    case FormFieldType.deskSingleValue:
        return FormFieldType.deskSingleValue;
    case FormFieldType.stageSingleValue:
        return FormFieldType.stageSingleValue;
    case FormFieldType.macroSingleValue:
        return FormFieldType.macroSingleValue;
    case FormFieldType.yesNo:
        return FormFieldType.yesNo;
    default:
        assertNever(type);
    }
}

function getFormForFiltering(form: Array<IFormField | IFormGroup>): Array<IFormField | IFormGroup> {
    return form.map((item) => {
        if (isIFormGroup(item)) {
            return getFormGroupForFiltering(item);
        } else if (isIFormField(item)) {
            return {...item, type: getFieldTypeForFiltering(item.type)};
        } else {
            return assertNever(item);
        }
    });
}

export function getFormGroupForFiltering(group: IFormGroup): IFormGroup {
    return {
        ...group,
        form: getFormForFiltering(group.form),
    };
}
