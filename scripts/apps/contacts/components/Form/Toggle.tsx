import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {KEYCODES} from '../../../contacts/constants';

export const Toggle: React.StatelessComponent<any> = ({value, onChange, readOnly, className}) => {
    const onClick = () => onChange({target: {value: !value}});
    const handleKeyDown = (event) => {
        if (event) {
            switch (event.keyCode) {
            case KEYCODES.ENTER:
            case KEYCODES.SPACE:
                event.preventDefault();
                onClick();
                break;
            default:
                break;
            }
        }
    };

    const classes = classNames(
        'sd-toggle',
        'sd-line-input__input',
        {
            checked: value,
            disabled: readOnly,
        },
        className,
    );

    return (
        <span tabIndex={0} onKeyDown={handleKeyDown}
            className={classes} onClick={!readOnly && onChange ? onClick : null}>
            <span className="inner"/>
        </span>
    );
};

Toggle.propTypes = {
    value: PropTypes.bool,
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
    className: PropTypes.string,
};

Toggle.defaultProps = {
    value: false,
    readOnly: false,
};
