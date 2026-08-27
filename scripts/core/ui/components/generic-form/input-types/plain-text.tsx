import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';
import {Input} from 'superdesk-ui-framework/react';

/**
 * Fixed length, so previewing a secret does not disclose how long it is.
 */
const PASSWORD_PREVIEW_MASK = '••••••••';

export class PlainText extends React.Component<IInputType<string>> {
    private passwordContainer = React.createRef<HTMLDivElement>();

    componentDidMount() {
        /*
            The framework `Input` forwards no autocomplete attribute, so it has to be set on the
            rendered input directly. Without it a browser may autofill a saved password into an
            empty key field, and saving the form would then silently rotate the stored key.
        */
        const input = this.passwordContainer.current?.querySelector('input');

        if (input != null) {
            input.setAttribute('autocomplete', 'new-password');
        }
    }

    private isPasswordField(): boolean {
        return this.props.formField?.component_parameters?.password === true;
    }

    private getInfo(): string | undefined {
        return this.props.formField?.component_parameters?.info;
    }

    render() {
        if (this.props.previewOutput) {
            const previewValue = this.isPasswordField() && this.props.value
                ? PASSWORD_PREVIEW_MASK
                : this.props.value;

            return <div data-test-id={`gform-output--${this.props.formField.field}`}>{previewValue}</div>;
        }

        // default value is required so React doesn't complain that uncontrolled component is changed to controlled.
        const valueWithDefaultValue = this.props.value || '';

        if (this.props.formField?.component_parameters?.multiline === true) {
            return (
                <div
                    className={
                        classNames(
                            'sd-input',
                            'd-flex',
                            'flex-col',
                            {
                                'sd-input--invalid': this.props.issues.length > 0,
                                'sd-input--required': this.props.formField.required === true,
                            },
                        )
                    }
                >
                    <label className="sd-input__label">{this.props.formField.label}</label>
                    <textarea
                        className="sd-input__input pt-1"
                        disabled={this.props.disabled}
                        value={valueWithDefaultValue}
                        onChange={(event) => this.props.onChange(event.target.value)}
                        rows={3}
                        style={{resize: 'vertical', height: 'auto'}}
                        data-test-id={`gform-input--${this.props.formField.field}`}
                    />
                    {this.props.issues.map((str) => (
                        <div key={str} className="sd-input__message">{str}</div>
                    ))}
                    {this.getInfo() != null && this.props.issues.length < 1 && (
                        <div className="sd-input__hint">{this.getInfo()}</div>
                    )}
                </div>
            );
        }

        const inputProps = {
            disabled: this.props.disabled,
            onChange: this.props.onChange,
            value: valueWithDefaultValue,
            label: this.props.formField.label,
            'data-test-id': `gform-input--${this.props.formField.field}`,
            error: this.props.issues[0],
            required: this.props.formField.required,

            // The framework hides the hint while the field is invalid, so an error never
            // competes with it for the same slot.
            info: this.getInfo(),
        };

        /*
            `type` is part of the Input props union, so each variant has to be spelled out;
            a computed `type` would not narrow to a single member of that union.
            The password variant is wrapped so its rendered input can be reached from a ref.
        */
        if (this.isPasswordField()) {
            return (
                <div ref={this.passwordContainer}>
                    <Input type="password" {...inputProps} />
                </div>
            );
        }

        return <Input type="text" {...inputProps} />;
    }
}
