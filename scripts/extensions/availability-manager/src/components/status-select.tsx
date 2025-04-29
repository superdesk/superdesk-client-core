import * as React from 'react';
import {Spacer, TreeSelect} from 'superdesk-ui-framework/react';
import {availabilityStatuses} from '../constants';
import {getLabelForStatus, getStylesForStatusDot} from '../utils';

interface IProps {
    value: typeof availabilityStatuses;
    onChange(value: typeof availabilityStatuses): void;
}

export class StatusSelect extends React.PureComponent<IProps> {
    render() {
        return (
            <TreeSelect
                kind="synchronous"
                value={this.props.value}
                getOptions={
                    () => availabilityStatuses
                        .map((id) => ({value: id}))
                }
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
                inlineLabel
                labelHidden
                required
                data-test-id="status"
            />
        );
    }
}
