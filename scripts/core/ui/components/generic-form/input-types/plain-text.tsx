import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';
import {Input} from 'superdesk-ui-framework/react';

export class PlainText extends React.Component<IInputType<string>> {
    render() {
        if (this.props.previewOutput) {
            return <div data-test-id={`gform-output--${this.props.formField.field}`}>{this.props.value}</div>;
        }

        // default value is required so React doesn't complain that uncontrolled component is changed to controlled.
        const valueWithDefaultValue = this.props.value || '';

        if (this.props.formField?.component_parameters?.multiline === true) {
            return (
                <div className="sd-input">
                    <div
                        className={classNames(
                            'sd-input__input',
                            {
                                'sd-input--invalid': this.props.issues.length > 0,
                                'sd-input--required': this.props.formField.required === true,
                            },
                        )}
                    >
                        <label className="sd-input__label">{this.props.formField.label}</label>
                        <textarea
                            disabled={this.props.disabled}
                            value={valueWithDefaultValue}
                            onChange={(event) => this.props.onChange(event.target.value)}
                            rows={3}
                            style={{resize: 'vertical', height: 'auto'}}
                            className="sd-input"
                            data-test-id={`gform-input--${this.props.formField.field}`}
                        />
                        {
                            this.props.issues.map((str, i) => (
                                <div key={i} className="sd-input__message">{str}</div>
                            ))
                        }
                    </div>
                </div>
            );
        }

        return (
            <Input
                type="text"
                disabled={this.props.disabled}
                onChange={this.props.onChange}
                value={valueWithDefaultValue}
                label={this.props.formField.label}
                data-test-id={`gform-input--${this.props.formField.field}`}
                error={this.props.issues[0]}
                required={this.props.formField.required}
            />
        );
    }
}
