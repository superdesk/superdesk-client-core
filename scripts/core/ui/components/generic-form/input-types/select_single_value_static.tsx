import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';

type IProps = IInputType<string | null>;

export class SelectSingleValue extends React.Component<IProps> {
    render() {
        const items: Array<{id: string; label: string}> = this.props.formField.component_parameters.items;

        if (this.props.previewOutput) {
            if (this.props.value == null) {
                return null;
            }

            const itemWithLabel = items.find((item) => item.id === this.props.value);

            return (
                <span>{itemWithLabel?.label ?? this.props.value}</span>
            );
        }

        return (
            <div
                className={classNames(
                    'sd-line-input',
                    {
                        'sd-line-input--invalid': this.props.issues.length > 0,
                        'sd-line-input--required': this.props.formField.required === true,
                        'sd-line-input--boxed': this.props.formField.component_parameters?.style?.boxed,
                    },
                )}
            >
                <label className="sd-line-input__label">{this.props.formField.label}</label>
                <select
                    className="sd-line-input__select"
                    disabled={this.props.disabled || items == null || items.length < 1}
                    value={this.props.value ?? ''}
                    onChange={(event) => {
                        this.props.onChange(event.target.value === '' ? null : event.target.value);
                    }}
                    data-test-id={`gform-input--${this.props.formField.field}`}
                >
                    <option value="" />
                    {
                        items == null
                            ? null
                            : items.map(({id, label}) => (
                                <option key={id} value={id}>{label}</option>
                            ))
                    }
                </select>
                {
                    this.props.issues.map((str, i) => (
                        <div key={i} className="sd-line-input__message">{str}</div>
                    ))
                }
            </div>
        );
    }
}
