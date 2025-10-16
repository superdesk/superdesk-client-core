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
                    valueType="date"
                    labelHidden
                    inlineLabel
                    dateFormat={appConfig.view.dateformat}
                    onChange={this.props.onChange}
                    value={this.props.value ?? null}
                    disabled={this.props.config.readOnly}
                    fullWidth
                    timeHeaderTemplate={
                        this.props.config.getTimeHeaderTemplate?.(this.props.value, this.props.onChange)
                    }
                    timeFooterTemplate={
                        this.props.config.getTimeFooterTemplate?.(this.props.value, this.props.onChange)
                    }
                />
            </Container>
        );
    }
}
