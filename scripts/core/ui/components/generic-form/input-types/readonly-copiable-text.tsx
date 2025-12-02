import React from 'react';
import {IInputType} from '../interfaces/input-types';
import {Input, Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {noop} from 'lodash';

export class ReadonlyCopyableText extends React.Component<IInputType<string>> {
    handleCopy = () => {
        const value = this.props.value || '';

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value);
        } else {
            const textArea = document.createElement('textarea');

            textArea.value = value;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
            } catch (err) {
                console.error('Failed to copy text:', err);
            }

            document.body.removeChild(textArea);
        }
    }

    render() {
        if (this.props.previewOutput) {
            return <div data-test-id={`gform-output--${this.props.formField.field}`}>{this.props.value}</div>;
        }

        const value = this.props.value || '';

        return (
            <div
                className="sd-line-input"
                style={{
                    display: 'flex',
                    alignItems: 'end',
                    gap: 'var(--gap--small)',
                }}
            >
                <Input
                    label={this.props.formField.label}
                    type="text"
                    value={value}
                    onChange={noop}
                    disabled={true}
                    required={this.props.formField.required}
                    data-test-id={`gform-input--${this.props.formField.field}`}
                />
                <Button
                    text={gettext('Copy')}
                    icon="copy"
                    iconOnly={true}
                    onClick={this.handleCopy}
                    type="default"
                    style="hollow"
                    size="normal"
                    data-test-id={`gform-copy-button--${this.props.formField.field}`}
                />
            </div>
        );
    }
}
