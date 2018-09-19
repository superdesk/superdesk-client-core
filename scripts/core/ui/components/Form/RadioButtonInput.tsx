import React from 'react';
import PropTypes from 'prop-types';
import {Checkbox, Label, LineInput} from '.';

/**
 * @ngdoc react
 * @name RadioButtonInput
 * @description Component to show radio-button
 */
export const RadioButtonInput: React.StatelessComponent<any> = ({
    field,
    value,
    onChange,
    label,
    options,
    readOnly,
}) => (
    <LineInput>
        <Label text={label} />
        <div className="flex-grid flex-grid--boxed-small flex-grid--wrap-items flex-grid--small-2">
            {options.map((state) =>
                <Checkbox
                    key={state.value}
                    field={field}
                    label={state.label}
                    value={value}
                    checkedValue={state.value}
                    onChange={(_field, _value) => onChange(_field, _value)}
                    type="radio"
                    labelPosition="inside"
                    readOnly={readOnly}
                />,
            )}
        </div>
    </LineInput>
);

RadioButtonInput.propTypes = {
    field: PropTypes.string,
    value: PropTypes.string,
    label: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.array.isRequired,
    readOnly: PropTypes.bool,
};

RadioButtonInput.defaultProps = {
    value: '',
    options: [],
    readOnly: false,
};
