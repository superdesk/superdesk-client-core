import {assertNever} from 'core/helpers/typescript-helpers';
import {GenericFormFieldType} from './interfaces/form';

export function generateFilterForServer(type: GenericFormFieldType, value: any): any {
    switch (type) {
        case GenericFormFieldType.plainText:
            return {
                $regex: value,
                $options: 'i',
            };

        case GenericFormFieldType.vocabularySingleValue:
        case GenericFormFieldType.contentFilterSingleValue:
        case GenericFormFieldType.checkbox:
        case GenericFormFieldType.deskSingleValue:
        case GenericFormFieldType.stageSingleValue:
        case GenericFormFieldType.macroSingleValue:
        case GenericFormFieldType.select:
        case GenericFormFieldType.selectMultiple:
        case GenericFormFieldType.number:
        case GenericFormFieldType.duration:
            return value;

        case GenericFormFieldType.textEditor3:
            throw new Error(
                'Operation not supported. Plaintext input has to be used to filter this component\'s output',
            );

        case GenericFormFieldType.yesNo:
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
