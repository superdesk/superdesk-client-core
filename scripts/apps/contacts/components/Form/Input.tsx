import React from 'react';
import PropTypes from 'prop-types';


export const Input:React.StatelessComponent<any> = ({
    field,
    type,
    value,
    onChange,
    placeholder,
    onBlur,
    onClick,
    readOnly,
    required,
    refNode,
    className,
    autoFocus,
}) => {
    const onInputChanged = (e) => {
        let data = e.target.value;

        if (type === 'file') {
            data = e.target.files;
        }

        onChange(field, data, e);
    };

    return (
        <input
            className={className ? `sd-line-input__input ${className}` : 'sd-line-input__input'}
            type={type}
            name={field}
            value={value}
            placeholder={placeholder}
            onChange={onInputChanged}
            onBlur={onBlur}
            onClick={onClick}
            disabled={readOnly}
            required={required}
            ref={refNode}
            autoFocus={autoFocus} />
    );
};

Input.propTypes = {
    field: PropTypes.string,
    type: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.bool,
    ]),
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    onClick: PropTypes.func,
    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    required: PropTypes.bool,
    refNode: PropTypes.func,
    className: PropTypes.string,
    autoFocus: PropTypes.bool,
};

Input.defaultProps = {
    type: 'text',
    readOnly: false,
    required: false,
};
