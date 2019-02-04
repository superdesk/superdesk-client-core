import {TextSingleLine} from "./input-types/text-single-line";
import {assertNever} from "core/helpers/typescript-helpers";
import {IFormField} from "./interfaces/form";

export function getFormFieldComponent(type: IFormField['type']) {
    if (type === 'single_line_text') {
        return TextSingleLine;
    } else {
        assertNever(type);
    }
}
