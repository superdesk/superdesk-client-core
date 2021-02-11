import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';

type IProps = IInputType<Array<string>>;

export class SelectMultipleValues extends React.Component<IProps> {
    render() {
        const items: Array<{id: string; label: string}> = this.props.formField.component_parameters.items;

        if (this.props.previewOutput) {
            if (this.props.value == null) {
                return null;
            }

            const itemsWithLabels = this.props.value.map((id) => items.find((item) => item.id === id));

            if (itemsWithLabels.some((item) => item == null)) {
                return (
                    <span>{this.props.value.join(', ')}</span>
                );
            } else {
                return (
                    <span>{itemsWithLabels.map((item) => item.label).join(', ')}</span>
                );
            }
        }

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
                <select
                    disabled={this.props.disabled || items == null || items.length < 1}
                    value={this.props.value || []}
                    onChange={(event) => {
                        this.props.onChange(Array.from(event.target.selectedOptions).map((option) => option.value));
                    }}
                    data-test-id={`gform-input--${this.props.formField.field}`}
                    multiple
                >
                    {
                        items == null
                            ? null
                            : items.map(({id, label}, i) => (
                                <option key={i} value={id}>{label}</option>
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
