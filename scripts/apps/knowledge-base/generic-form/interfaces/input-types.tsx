import {IFormField} from "./form";

export interface IInputType<T> {
    formField: IFormField;
    disabled: boolean;
    value: T;
    issues: Array<string>;
    onChange: (nextValue: T) => void;
}
