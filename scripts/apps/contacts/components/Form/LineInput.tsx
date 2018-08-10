import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const LineInput:React.StatelessComponent<any> = ({
    children,
    required,
    invalid,
    readOnly,
    boxed,
    isSelect,
    noMargin,
    noLabel,
    withButton,
    labelLeft,
    labelLeftAuto,
    hint,
    message,
    className,
}) => (
    <div className={classNames(
        'sd-line-input',
        {
            'sd-line-input--required': required,
            'sd-line-input--invalid': invalid,
            'sd-line-input--disabled': readOnly,
            'sd-line-input--boxed': boxed,
            'sd-line-input--is-select': isSelect,
            'sd-line-input--no-margin': noMargin,
            'sd-line-input--no-label': noLabel,
            'sd-line-input--with-button': withButton,
            'sd-line-input--label-left': labelLeft,
            'sd-line-input--label-left-auto': labelLeftAuto,
        },
        className
    )}>
        {children}
        {hint && <div className="sd-line-input__hint">{hint}</div>}
        {message && <div className={classNames(
            'sd-line-input__message',
            {
                'sd-line-input__message--add-padding': hint,
            })}>
            {message}
        </div>}
    </div>
);

export const LineInputProps = {
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    isSelect: PropTypes.bool,
    noMargin: PropTypes.bool,
    noLabel: PropTypes.bool,
    withButton: PropTypes.bool,
    labelLeft: PropTypes.bool,
    labelLeftAuto: PropTypes.bool,
    hint: PropTypes.string,
    message: PropTypes.string,
};

export const LineInputDefaultProps = {
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    isSelect: false,
    noMargin: false,
    noLabel: false,
    withButton: false,
    labelLeft: false,
    labelLeftAuto: false,
};

LineInput.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    ...LineInputProps,
};

LineInput.defaultProps = {...LineInputDefaultProps};
