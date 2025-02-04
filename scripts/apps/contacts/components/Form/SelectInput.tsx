import React from 'react';
import PropTypes from 'prop-types';
import {LineInput, Label, Select} from './';
import {get, isObject} from 'lodash';

export const SelectInput: React.StatelessComponent<any> = ({
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
        let _key = '';

        if (clearable) {
            if (isObject(value)) {
                _key = get(value, keyField, '');
            } else {
                _key = value;
            }
        } else {
            _key = get(value, keyField, get(options, `[0].${keyField}`));
        }

        return _key;
    };

    const key = getKey();

    const opts = options.map((opt) => ({
        key: get(opt, keyField),
        label: get(opt, labelField),
    }));

    const onChangeHandler = (_field, _key) => {
        const _value = options.find(
            (option) => get(option, keyField) === _key,
        ) || null;

        onChange(_field, get(_value, keyField, ''));
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
