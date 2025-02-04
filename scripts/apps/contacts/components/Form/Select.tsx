import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Select: React.StatelessComponent<any> = ({field, value, onChange, options, readOnly, clearable}) => (
    <select
        className={classNames(
            'sd-line-input__select',
        )}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        name={field}
        disabled={readOnly}
    >
        {clearable && (
            <option value="" />
        )}
        {options.map((opt, index) => (
            <option
                key={opt.key || index}
                value={opt.key}
            >
                {opt.label}
            </option>
        ))}
    </select>
);

Select.propTypes = {
    field: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
        label: PropTypes.string,
    })),
    readOnly: PropTypes.bool,
    clearable: PropTypes.bool,
};

Select.defaultProps = {
    readOnly: false,
    clearable: false,
};
