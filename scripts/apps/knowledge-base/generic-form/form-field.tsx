import {TextSingleLine} from "./input-types/text-single-line";
import {assertNever} from "core/helpers/typescript-helpers";
import {IFormField} from "./interfaces/form";
import {VocabularySingleValue} from "./input-types/vocabulary_single_value";
import {TextEditor3} from "./input-types/text-editor3";

export function getFormFieldComponent(type: IFormField['type']) {
    switch (type) {
        case 'text_single_line':
            return TextSingleLine;
        case 'text_editor3':
            return TextEditor3;
        case 'vocabulary_single_value':
            return VocabularySingleValue;
        default:
            assertNever(type);
    }
}
