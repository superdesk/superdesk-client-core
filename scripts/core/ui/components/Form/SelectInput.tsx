import React from 'react';
import PropTypes from 'prop-types';
import {LineInput, Label, Select} from './';
import {get} from 'lodash';

/**
 * @ngdoc react
 * @name SelectInput
 * @description Component to select a list from dropdown with field label
 */
export const SelectInput:React.StatelessComponent<any> = ({
    field,
    label,
    value,
    options,
    keyField,
    labelField,
    onChange,
    readOnly,
    clearable,
    autoFocus,
    refNode,
    onFocus,
    ...props
}) => {
    const key = clearable ?
        get(value, keyField, '') :
        get(value, keyField, get(options, `[0].${keyField}`));

    const opts = options.map((opt) => ({
        key: get(opt, keyField),
        label: get(opt, labelField),
    }));

    const onChangeHandler = (field, key) => {
        const value = options.find(
            (option) => get(option, keyField) === key
        ) || null;

        onChange(field, value);
    };

    return (
        <LineInput {...props} isSelect={true} readOnly={readOnly}>
            <Label text={label} />
            <Select
                field={field}
                value={key}
                onChange={onChangeHandler}
                options={opts}
                readOnly={readOnly}
                clearable={clearable}
                autoFocus={autoFocus}
                refNode={refNode}
                onFocus={onFocus}
            />
        </LineInput>
    );
};

SelectInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.object,
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
    autoFocus: PropTypes.bool,
    refNode: PropTypes.func,
    onFocus: PropTypes.func,
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
    autoFocus: false,
};
