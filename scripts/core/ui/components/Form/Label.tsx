import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

/**
 * @ngdoc react
 * @name Label
 * @description Form label component
 */
export const Label: React.StatelessComponent<any> = ({text, row, light, invalid}) => (
    !text ? null : (
        <label className={classNames({
            'sd-line-input__label': !row,
            'form-label': row,
            'form-label--light': row && light,
            'form-label--invalid': row && invalid,
        })}>
            {text}
        </label>
    )
);

Label.propTypes = {
    text: PropTypes.string,
    row: PropTypes.bool,
    light: PropTypes.bool,
    invalid: PropTypes.bool,
};

Label.defaultProps = {
    row: false,
    light: false,
    invalid: false,
};
