import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';

export class NumberComponent extends React.Component<IInputType<number>> {
    render() {
        if (this.props.previewOutput) {
            return <div data-test-id={`gform-output--${this.props.formField.field}`}>{this.props.value}</div>;
        }

        // Default value is required to make it a controlled input.
        // Empty string is used instead of a zero to allow for empty values.
        const valueWithDefaultValue = this.props.value ?? '';

        return (
            <div
                className={
                    classNames(
                        'sd-line-input',
                        {
                            'sd-line-input--invalid': this.props.issues.length > 0,
                            'sd-line-input--required': this.props.formField.required === true,
                            'sd-line-input--boxed': this.props.formField.component_parameters?.style?.boxed,
                        },
                    )
                }
            >
                <label className="sd-line-input__label">{this.props.formField.label}</label>
                <input
                    type="number"
                    disabled={this.props.disabled}
                    value={valueWithDefaultValue}
                    onChange={(event) => this.props.onChange(parseFloat(event.target.value))}
                    className="sd-line-input__input"
                    data-test-id={`gform-input--${this.props.formField.field}`}
                />
                {
                    this.props.issues.map((str, i) => (
                        <div key={i} className="sd-line-input__message">{str}</div>
                    ))
                }
            </div>
        );
    }
}
