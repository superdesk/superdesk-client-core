import {gettext} from 'core/utils';
import {IFormField} from 'superdesk-api';
import {getSelectSingleValue} from './select_single_value';

export interface ISelectAsyncOption {
    id: string;
    label: string;
}

/**
 * `component_parameters` of a `GenericFormFieldType.selectAsync` field.
 */
export interface ISelectAsyncParameters {
    /**
     * Called with the values of the form being edited. Rejecting is a supported outcome: the field
     * then falls back to a text input holding the current value, so the value can still be read,
     * typed by hand and saved while the options are out of reach.
     */
    getOptions: (formValues: {readonly [key: string]: any}) => Promise<Array<ISelectAsyncOption>>;

    /**
     * Fields whose change resets the value and re-runs `getOptions`.
     */
    dependentFields?: Array<string>;
}

function getParameters(formField: IFormField<any>): ISelectAsyncParameters {
    return formField.component_parameters as ISelectAsyncParameters;
}

export const SelectAsync = getSelectSingleValue(
    (props) => getParameters(props.formField).getOptions(props.formValues).catch(() => null),
    // a thunk so the string is translated when it is displayed, not when this module is loaded
    () => gettext('The list of options could not be loaded'),
    (props) => getParameters(props.formField).dependentFields ?? [],
    true, // editableWhenItemsUnavailable
);
