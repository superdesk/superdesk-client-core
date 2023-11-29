import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';
import {TreeSelect} from 'superdesk-ui-framework/react';

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

                <TreeSelect
                    error={this.props.issues[0]}
                    invalid={this.props.issues[0] != null}
                    required={this.props.formField.required}
                    allowMultiple
                    fullWidth
                    kind="synchronous"
                    getId={(item) => item.id}
                    getLabel={(item) => item.label}
                    getOptions={() => items != null ? items.map((item) => ({value: item})) : []}
                    onChange={(item) => {
                        this.props.onChange(item.map(({id}) => id));
                    }}
                    value={items.filter(({id}) => this.props.value?.includes(id) ?? [])}
                    disabled={this.props.disabled}
                    label={this.props.formField.label}
                    inlineLabel
                    labelHidden
                    zIndex={1051}
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
