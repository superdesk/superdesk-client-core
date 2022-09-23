import React from 'react';
import {TimePicker} from 'superdesk-ui-framework/react';
import {
    ITimeValueOperational,
    ITimeFieldConfig,
    ITimeUserPreferences,
    IEditorComponentProps,
} from 'superdesk-api';

type IProps = IEditorComponentProps<ITimeValueOperational, ITimeFieldConfig, ITimeUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        return (
            <Container>
                <TimePicker
                    value={this.props.value ?? ''}
                    onChange={(val) => {
                        this.props.onChange(val === '' ? null : val);
                    }}
                    disabled={this.props.readOnly}
                    allowSeconds={this.props.config.allowSeconds}
                />
            </Container>
        );
    }
}
