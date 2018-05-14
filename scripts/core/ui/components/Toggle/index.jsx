import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {KEYCODES} from '../constants';
import {onEventCapture} from '../utils';
import './style.scss';

/**
 * @ngdoc react
 * @name Toggle
 * @description Toggle component used to togle check/uncheck status
 */
export default function Toggle({value, onChange, readOnly, onFocus, className}) {
    const handleKeyDown = (event) => {
        if (event.keyCode === KEYCODES.ENTER) {
            onEventCapture(event);
            onChange({target: {value: !value}});
        }
    };
    const onClick = () => onChange({target: {value: !value}});
    const classes = classNames(
        'sd-toggle',
        'sd-line-input__input',
        {
            checked: value,
            disabled: readOnly,
            'sd-toggle--checked': value,
            'sd-toggle--disabled': readOnly,
        },
        className
    );

    return (
        <button
            type="button"
            tabIndex={0}
            className={classes}
            onClick={!readOnly && onChange ? onClick : null}
            onFocus={onFocus}
            onKeyDown= {!readOnly ? handleKeyDown : null}>
            <span className="inner"/>
        </button>
    );
}

Toggle.propTypes = {
    value: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    readOnly: PropTypes.bool,
    className: PropTypes.string,
};

Toggle.defaultProps = {
    value: false,
    readOnly: false,
};
