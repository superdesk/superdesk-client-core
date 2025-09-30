import {assertNever} from 'core/helpers/typescript-helpers';
import {isIFormGroup, isIFormField} from './interfaces/form';
import {IFormField, IFormGroup} from 'superdesk-api';

function getFormFieldsFromGroup<T extends object>(form: Array<IFormField<T> | IFormGroup<T>>): Array<IFormField<T>> {
    let fields: Array<IFormField<T>> = [];

    form.forEach((item) => {
        if (isIFormGroup(item)) {
            fields = fields.concat(getFormFieldsFlat(item));
        } else if (isIFormField(item)) {
            fields = fields.concat(item);
        } else {
            assertNever(item);
        }
    });

    return fields;
}

export function getFormFieldsFlat<T extends object>(group: IFormGroup<T>): Array<IFormField<T>> {
    return getFormFieldsFromGroup(group.form);
}
