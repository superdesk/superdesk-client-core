import React from 'react';
import {DateTimePicker} from 'superdesk-ui-framework/react';
import {
    IEditorComponentProps,
    IDateTimeFieldConfig,
    IDateTimeValueOperational,
    IDateTimeUserPreferences,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';

type IProps = IEditorComponentProps<IDateTimeValueOperational, IDateTimeFieldConfig, IDateTimeUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        return (
            <Container>
                <DateTimePicker
                    dateFormat={appConfig.view.dateformat}
                    label={{
                        text: gettext('Date time'),
                        hidden: true,
                    }}
                    onChange={this.props.onChange}
                    value={this.props.value}
                    disabled={this.props.config.readOnly}
                    width={this.props.config.width}
                />
            </Container>
        );
    }
}
