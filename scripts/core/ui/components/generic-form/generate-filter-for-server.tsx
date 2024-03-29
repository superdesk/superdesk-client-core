import {assertNever} from 'core/helpers/typescript-helpers';
import {FormFieldType} from './interfaces/form';

export function generateFilterForServer(type: FormFieldType, value: any): any {
    switch (type) {
    case FormFieldType.plainText:
        return {
            $regex: value,
            $options: 'i',
        };

    case FormFieldType.vocabularySingleValue:
    case FormFieldType.contentFilterSingleValue:
    case FormFieldType.checkbox:
    case FormFieldType.deskSingleValue:
    case FormFieldType.stageSingleValue:
    case FormFieldType.macroSingleValue:
    case FormFieldType.select:
    case FormFieldType.selectMultiple:
    case FormFieldType.number:
    case FormFieldType.duration:
        return value;

    case FormFieldType.textEditor3:
        throw new Error(
            'Operation not supported. Plaintext input has to be used to filter this component\'s output',
        );

    case FormFieldType.yesNo:
        if (value === 'true') {
            return true;
        } else if (value === 'false') {
            return false;
        } else {
            return undefined;
        }

    default:
        assertNever(type);
    }
}
