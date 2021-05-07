import {getSelectSingleValue} from './select_single_value';

export const Select = getSelectSingleValue(
    (props) => Promise.resolve(props.formField.component_parameters.options),
);
