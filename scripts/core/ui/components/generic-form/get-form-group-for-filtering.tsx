import {assertNever} from 'core/helpers/typescript-helpers';
import {IFormField, IFormGroup, isIFormGroup, isIFormField} from './interfaces/form';

// different components must be used for filtering than for entering/updating items
function getFieldTypeForFiltering(type: IFormField['type']): IFormField['type'] {
    switch (type) {
    case 'text_single_line':
        return 'text_single_line';
    case 'text_editor3':
        // even though text_editor3 outputs HTML, plaintext has to be used for filtering
        return 'text_single_line';
    case 'vocabulary_single_value':
        return 'vocabulary_single_value';
    case 'checkbox':
        return 'checkbox';
    case 'content_filter_single_value':
        return 'content_filter_single_value';
    case 'desk_single_value':
        return 'desk_single_value';
    case 'stage_single_value':
        return 'stage_single_value';
    case 'macro_single_value':
        return 'macro_single_value';
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
