import {IFormField} from "./form";

export interface IInputType<T> {
    formField: IFormField;
    disabled: boolean;
    value: T;
    issues: Array<string>;

    // renders a minimal representation of the value without any editing controls
    previewOuput: boolean;

    onChange: (nextValue: T) => void;
}
