import React from 'react';
import {DateTimePicker} from 'superdesk-ui-framework/react';
import {
    IEditorComponentProps,
    IDateTimeFieldConfig,
    IDateTimeValueOperational,
    IDateTimeUserPreferences,
} from 'superdesk-api';
import {appConfig} from 'appConfig';

type IProps = IEditorComponentProps<IDateTimeValueOperational, IDateTimeFieldConfig, IDateTimeUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        return (
            <Container>
                <DateTimePicker
                    valueType='date'
                    dateFormat={appConfig.view.dateformat}
                    onChange={this.props.onChange}
                    value={this.props.value ?? null}
                    disabled={this.props.config.readOnly}
                    fullWidth
                />
            </Container>
        );
    }
}
