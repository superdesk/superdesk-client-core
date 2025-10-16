import {assertNever} from 'core/helpers/typescript-helpers';
import {isIFormGroup, isIFormField, GenericFormFieldType} from './interfaces/form';
import {IFormField, IFormGroup} from 'superdesk-api';

// different components must be used for filtering than for entering/updating items
function getFieldTypeForFiltering(type: GenericFormFieldType): GenericFormFieldType {
    switch (type) {
        case GenericFormFieldType.plainText:
            return GenericFormFieldType.plainText;
        case GenericFormFieldType.textEditor3:
        // even though textEditor3 outputs HTML, plaintext has to be used for filtering
            return GenericFormFieldType.plainText;
        case GenericFormFieldType.number: // should be a range
            return GenericFormFieldType.number;
        case GenericFormFieldType.duration: // should be a range
            return GenericFormFieldType.duration;
        case GenericFormFieldType.vocabularySingleValue:
            return GenericFormFieldType.vocabularySingleValue;
        case GenericFormFieldType.checkbox:
            return GenericFormFieldType.yesNo;
        case GenericFormFieldType.contentFilterSingleValue:
            return GenericFormFieldType.contentFilterSingleValue;
        case GenericFormFieldType.deskSingleValue:
            return GenericFormFieldType.deskSingleValue;
        case GenericFormFieldType.stageSingleValue:
            return GenericFormFieldType.stageSingleValue;
        case GenericFormFieldType.macroSingleValue:
            return GenericFormFieldType.macroSingleValue;
        case GenericFormFieldType.yesNo:
            return GenericFormFieldType.yesNo;
        case GenericFormFieldType.select:
            return GenericFormFieldType.select;
        case GenericFormFieldType.selectMultiple:
            return GenericFormFieldType.selectMultiple;
        default:
            assertNever(type);
    }
}

function getFormForFiltering<T extends object>(
    form: Array<IFormField<T> | IFormGroup<T>>,
): Array<IFormField<T> | IFormGroup<T>> {
    return form.map((item) => {
        if (isIFormGroup(item)) {
            return getFormGroupForFiltering(item);
        } else if (isIFormField(item)) {
            return {...item, type: getFieldTypeForFiltering(item.type), required: false};
        } else {
            return assertNever(item);
        }
    });
}

export function getFormGroupForFiltering<T extends object>(group: IFormGroup<T>): IFormGroup<T> {
    return {
        ...group,
        form: getFormForFiltering(group.form),
    };
}
