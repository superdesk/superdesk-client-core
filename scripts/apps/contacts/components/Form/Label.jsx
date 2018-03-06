import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Label = ({text, row, light, className}) => (!text ? null : (
    <label className={classNames({
        'sd-line-input__label': !row,
        'form-label': row,
        'form-label--light': row && light
    }, className)}>
        {text}
    </label>
));

Label.propTypes = {
    text: PropTypes.string,
    row: PropTypes.bool,
    light: PropTypes.bool,
    className: PropTypes.string,
};

Label.defaultProps = {
    row: false,
    light: false,
};
