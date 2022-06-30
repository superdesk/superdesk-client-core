import * as React from 'react';
import {Input} from 'superdesk-ui-framework/react';

interface IProps {
    label?: string;
    error?: string;
    value: number | null;
    onChange(val: number | null): void;
    readOnly?: boolean;
}

// TODO: remove when fixed in ui-framework
export class NumberInputTemp extends React.PureComponent<IProps> {
    render() {
        return (
            <Input
                type="number"
                inlineLabel={this.props.label == null}
                labelHidden={this.props.label == null}
                label={this.props.label}
                value={this.props.value ?? 0}
                onChange={(val) => {
                    this.props.onChange(val);
                }}
                error={this.props.error}
                invalid={this.props.error != null}
                disabled={this.props.readOnly}
            />
        );
    }
}
