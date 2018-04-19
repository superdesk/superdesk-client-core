import React from 'react';
import PropTypes from 'prop-types';
import {LineInput, Label, Select} from './';
import {get, isObject} from 'lodash';

export const SelectInput = ({
    field,
    label,
    value,
    options,
    keyField,
    labelField,
    onChange,
    readOnly,
    clearable,
    ...props
}) => {
    const getKey = () => {
        let key = '';

        if (clearable) {
            if (isObject(value)) {
                key = get(value, keyField, '');
            } else {
                key = value;
            }
        } else {
            key = get(value, keyField, get(options, `[0].${keyField}`));
        }

        return key;
    };

    const key = getKey();

    const opts = options.map((opt) => ({
        key: get(opt, keyField),
        label: get(opt, labelField),
    }));

    const onChangeHandler = (field, key) => {
        const value = options.find(
            (option) => get(option, keyField) === key
        ) || null;

        onChange(field, get(value, keyField, ''));
    };

    return (
        <LineInput {...props} isSelect={true} readOnly={readOnly}>
            {label && <Label text={label} />}
            <Select
                field={field}
                value={key}
                onChange={onChangeHandler}
                options={opts}
                readOnly={readOnly}
                clearable={clearable}
            />
        </LineInput>
    );
};

SelectInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    onChange: PropTypes.func.isRequired,

    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,

    options: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string,
        label: PropTypes.string,
        value: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
            PropTypes.number,
        ]),
    })).isRequired,
    keyField: PropTypes.string,
    labelField: PropTypes.string,
    clearable: PropTypes.bool,
};

SelectInput.defaultProps = {
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
    keyField: 'qcode',
    labelField: 'label',
    clearable: false,
};
