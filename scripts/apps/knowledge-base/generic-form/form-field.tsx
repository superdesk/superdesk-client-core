import {TextSingleLine} from "./input-types/text-single-line";
import {assertNever} from "core/helpers/typescript-helpers";
import {IFormField} from "./interfaces/form";
import {VocabularySingleValue} from "./input-types/vocabulary_single_value";

export function getFormFieldComponent(type: IFormField['type']) {
    if (type === 'text_single_line') {
        return TextSingleLine;
    } if (type === 'vocabulary_single_value') {
        return VocabularySingleValue;
    } else {
        assertNever(type);
    }
}
