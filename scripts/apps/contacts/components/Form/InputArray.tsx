import React from 'react';
import PropTypes from 'prop-types';
import {Row} from './';
import {cloneDeep} from 'lodash';

export const InputArray = ({
    field,
    value,
    onChange,
    addButtonText,
    component,
    defaultValue,
    readOnly,
    errors,
    ...props
}) => {
    const add = () => {
        let clonedValue = cloneDeep(value);

        clonedValue.push(cloneDeep(defaultValue));
        onChange(field, [...clonedValue]);
    };

    const remove = (index) => {
        let clonedValue = cloneDeep(value);

        clonedValue.splice(index, 1);
        onChange(field, [...clonedValue]);
    };

    const Component = component;

    return (
        <Row>
            {value.map((val, index) => (
                <Component
                    key={index}
                    field={`${field}[${index}]`}
                    onChange={onChange}
                    value={val}
                    remove={remove.bind(null, index)}
                    readOnly={readOnly}
                    errors={errors}
                    {...props} />
            ))}

            {!readOnly && (
                <button
                    className="btn btn-small btn--expanded"
                    onClick={add}
                    type="button"
                >
                    {addButtonText ? gettext(addButtonText) : <i className="icon-plus-large" />}
                </button>
            )}
        </Row>
    );
};

InputArray.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    addButtonText: PropTypes.string,
    component: PropTypes.func.isRequired,
    defaultValue: PropTypes.any,

    hint: PropTypes.string,
    message: PropTypes.string,
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
    errors: PropTypes.object,
};

InputArray.defaultProps = {
    value: [],
    defaultValue: {},
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: true,
    errors: {},
};
