import {IFormField} from 'superdesk-api';

export interface IInputType<T> {
    // required for composite inputs operating on more than one field
    readonly formValues: {readonly [key: string]: any};

    readonly formField: IFormField;
    readonly disabled: boolean;
    readonly value: T;

    // below issues only apply to primary field defined in IFormField['field']
    readonly issues: Array<string>;

    // renders a minimal representation of the value without any editing controls
    readonly previewOutput: boolean;

    // fieldName is only passed by components which can change multiple fields
    readonly onChange: (nextValue: T, fieldName?: string) => void;
}
