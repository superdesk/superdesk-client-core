import {assertNever} from 'core/helpers/typescript-helpers';
import {isIFormGroup, isIFormField} from './interfaces/form';
import {IFormField, IFormGroup} from 'superdesk-api';

function getFormFieldsFromGroup(form: Array<IFormField | IFormGroup>): Array<IFormField> {
    let fields: Array<IFormField> = [];

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

export function getFormFieldsFlat(group: IFormGroup): Array<IFormField> {
    return getFormFieldsFromGroup(group.form);
}
