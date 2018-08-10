import React from 'react';
import PropTypes from 'prop-types';

import {LineInput, Label} from '../';
import {LineInputProps, LineInputDefaultProps} from '../LineInput';
import {Toggle} from '../../';

import './style.scss';

/**
 * @ngdoc react
 * @name ToggleInput
 * @description Component to toggle input values
 */
export const ToggleInput = ({field, label, value, onChange, readOnly, className, labelLeftAuto, onFocus, ...props}) => (
    <LineInput {...props} readOnly={readOnly} labelLeftAuto={labelLeftAuto} className="sd-line-input__toggle">
        <Label text={label}/>
        <Toggle
            value={value}
            onChange={(e) => onChange(field, e.target.value)}
            readOnly={readOnly}
            className={className}
            onFocus={onFocus}
        />
    </LineInput>
);

ToggleInput.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string,
    labelLeftAuto: PropTypes.bool,
    ...LineInputProps,
};

ToggleInput.defaultProps = {
    value: false,
    labelLeftAuto: false,
    ...LineInputDefaultProps,
};
