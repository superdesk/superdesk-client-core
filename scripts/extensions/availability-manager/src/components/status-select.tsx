import * as React from 'react';
import {Spacer, TreeSelect} from 'superdesk-ui-framework/react';
import {availabilityStatuses} from '../constants';
import {getLabelForStatus, getStylesForStatusDot} from '../utils';

interface IProps {
    label: {text: string, hidden?: boolean, inline?: boolean};
    value: typeof availabilityStatuses;
    onChange(value: typeof availabilityStatuses): void;
    allowMultiple?: boolean;
    required?: boolean; // false
}

export class StatusSelect extends React.PureComponent<IProps> {
    render() {
        const labelHidden = this.props.label.hidden ?? false;
        const inlineLabel = this.props.label?.inline ?? false;

        return (
            <TreeSelect
                kind="synchronous"
                value={this.props.value}
                getOptions={() => availabilityStatuses.map((id) => ({value: id}))}
                getId={(id) => id}
                getLabel={(id) => getLabelForStatus(id)}
                onChange={this.props.onChange}
                optionTemplate={(id) => (
                    <Spacer h gap="4" justifyContent="start" noWrap>
                        <div>
                            <div
                                style={{
                                    ...getStylesForStatusDot(id),
                                }}
                            />
                        </div>

                        <div>{getLabelForStatus(id)}</div>
                    </Spacer>
                )}
                fullWidth={true}
                inlineLabel={inlineLabel || labelHidden}
                labelHidden={labelHidden}
                label={this.props.label.text}
                required={this.props.required}
                allowMultiple={this.props.allowMultiple ?? false}
                data-test-id="status"
            />
        );
    }
}
