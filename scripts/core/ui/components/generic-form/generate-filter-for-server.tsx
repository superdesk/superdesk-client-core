import {assertNever} from "core/helpers/typescript-helpers";
import {IFormField} from "./interfaces/form";

export function generateFilterForServer(type: IFormField['type'], value: any): any {
    switch (type) {
    case 'text_single_line':
        return {
            $regex: value,
            $options: 'i',
        };

    case 'vocabulary_single_value':
    case 'content_filter_single_value':
    case 'checkbox':
    case 'desk_single_value':
    case 'stage_single_value':
    case 'macro_single_value':
        return value;

    case 'text_editor3':
        throw new Error(
            'Operation not supported. Plaintext input has to be used to filter this component\'s output',
        );

    case 'yes_no':
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
