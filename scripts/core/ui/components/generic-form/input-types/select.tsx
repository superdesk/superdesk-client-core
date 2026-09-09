import {getSelectSingleValue} from './select-single-value';

export const Select = getSelectSingleValue(
    (props) => Promise.resolve(props.formField.component_parameters.options),
);
