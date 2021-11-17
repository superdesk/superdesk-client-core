import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';

export class PlainText extends React.Component<IInputType<string>> {
    render() {
        if (this.props.previewOutput) {
            return <div data-test-id={`gform-output--${this.props.formField.field}`}>{this.props.value}</div>;
        }

        // default value is required so React doesn't complain that uncontrolled component is changed to controlled.
        const valueWithDefaultValue = this.props.value || '';

        const fieldElement = this.props.formField?.component_parameters?.multiline === true
            ? (
                <textarea
                    disabled={this.props.disabled}
                    value={valueWithDefaultValue}
                    onChange={(event) => this.props.onChange(event.target.value)}
                    rows={3}
                    style={{resize: 'vertical', height: 'auto'}}
                    className="sd-line-input__input"
                    data-test-id={`gform-input--${this.props.formField.field}`}
                />
            )
            : (
                <input
                    type="text"
                    disabled={this.props.disabled}
                    value={valueWithDefaultValue}
                    onChange={(event) => this.props.onChange(event.target.value)}
                    className="sd-line-input__input"
                    data-test-id={`gform-input--${this.props.formField.field}`}
                />
            );

        return (
            <div
                className={classNames(
                    'sd-line-input',
                    {
                        'sd-line-input--invalid': this.props.issues.length > 0,
                        'sd-line-input--required': this.props.formField.required === true,
                    },
                )}
            >
                <label className="sd-line-input__label">{this.props.formField.label}</label>
                {fieldElement}
                {
                    this.props.issues.map((str, i) => (
                        <div key={i} className="sd-line-input__message">{str}</div>
                    ))
                }
            </div>
        );
    }
}
