import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';

export class TextSingleLine extends React.Component<IInputType<string>> {
    render() {
        if (this.props.previewOuput) {
            return <div data-test-id={`gform-output--${this.props.formField.field}`}>{this.props.value}</div>;
        }

        // default value is required so React doesn't complain that uncontrolled component is changed to controlled.
        const valueWithDefaultValue = this.props.value || '';

        return (
            <div className={classNames('sd-line-input', {'sd-line-input--invalid': this.props.issues.length > 0})}>
                <label className="sd-line-input__label">{this.props.formField.label}</label>
                <input
                    type="text"
                    disabled={this.props.disabled}
                    value={valueWithDefaultValue}
                    onChange={(event) => this.props.onChange(event.target.value)}
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
