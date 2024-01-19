import React from 'react';
import classNames from 'classnames';
import {DurationInput, getDurationString} from 'superdesk-ui-framework/react';
import {IInputType} from '../interfaces/input-types';

export class DurationComponent extends React.Component<IInputType<number>> {
    render() {
        if (this.props.previewOutput) {
            return (
                <div
                    data-test-id={`gform-output--${this.props.formField.field}`}
                >
                    {getDurationString(this.props.value)}
                </div>
            );
        }

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

                <DurationInput
                    label=""
                    labelHidden
                    inlineLabel
                    seconds={this.props.value ?? 0}
                    onChange={(val) => {
                        this.props.onChange(val);
                    }}
                    invalid={this.props.issues.length > 0}
                    error={this.props.issues[0]}
                    required={this.props.formField.required === true}
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
