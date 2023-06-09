import React from 'react';
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
            <div style={{marginBottom: '1.8em'}}>
                <TreeSelect
                    allowMultiple
                    fullWidth
                    kind="synchronous"
                    getId={(item) => item}
                    getLabel={(item) => item}
                    getOptions={() => items?.map((item) => ({value: item.label}))}
                    onChange={(item) => {
                        this.props.onChange(item);
                    }}
                    value={this.props.value}
                    disabled={this.props.disabled}
                    label={this.props.formField.label}
                />
            </div>
        );
    }
}
