import {assertNever} from "core/helpers/typescript-helpers";
import {IFormField, FormFieldType} from "./interfaces/form";

export function generateFilterForServer(type: IFormField['type'], value: any): any {
    switch (type) {
    case FormFieldType.textSingleLine:
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
