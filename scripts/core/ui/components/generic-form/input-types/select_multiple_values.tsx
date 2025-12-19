import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';
import {TreeSelect} from 'superdesk-ui-framework/react';

type IProps = IInputType<Array<string>>;

interface IOption {
    id: string;
    label: string;
}

export class SelectMultipleValues extends React.Component<IProps> {
    render() {
        const items: Array<IOption> = this.props.formField.component_parameters.items;

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

        const optionsLookup = new Map<string, IOption>();

        for (const item of items) {
            optionsLookup.set(item.id, item);
        }

        return (
            <TreeSelect
                boxedStyle={this.props.formField.component_parameters?.style?.boxed}
                error={this.props.issues[0]}
                invalid={(this.props.issues ?? []).length > 0}
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
                value={(this.props.value ?? []).map((id) => optionsLookup.get(id))}
                disabled={this.props.disabled}
                label={this.props.formField.label}
                data-test-id={this.props.formField.component_parameters?.dataTestId}
            />
        );
    }
}
