import React from 'react';
import {InputWrapper} from 'superdesk-ui-framework/react/components/Form';

interface IProps {
    label: string;
    value: string;
    onChange(value: string): void;
    info?: string;
    error?: string;
    maxLength?: number;
    rows?: number;
    required?: boolean;
    disabled?: boolean;
    'data-test-id'?: string;
}

let nextId = 0;

/**
 * Stand-in for the ui-framework `TextArea`, which is not released yet (SDESK-8025). Its props
 * mirror ui-framework's `Input` so it can be swapped for the real one without touching callers.
 */
export class TextAreaInput extends React.PureComponent<IProps> {
    private htmlId = `ai-studio-textarea-${nextId++}`;

    render() {
        const {label, value, onChange, info, error, maxLength, rows, required, disabled} = this.props;

        return (
            <InputWrapper
                label={label}
                info={info}
                error={error}
                invalid={error != null}
                required={required}
                disabled={disabled}
                maxLength={maxLength}
                value={value}
                htmlId={this.htmlId}
            >
                <textarea
                    id={this.htmlId}
                    className="sd-input__input"
                    style={{height: 'auto', minHeight: 0, resize: 'vertical', paddingBlock: 8}}
                    rows={rows ?? 4}
                    value={value}
                    required={required}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.value)}
                    data-test-id={this.props['data-test-id']}
                />
            </InputWrapper>
        );
    }
}
