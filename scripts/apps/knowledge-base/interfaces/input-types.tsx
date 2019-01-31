import {IFormField} from "./form";

export interface IInputType<T> {
    formField: IFormField;
    disabled: boolean;
    value: T;
    onChange: (nextValue: T) => void;
}
