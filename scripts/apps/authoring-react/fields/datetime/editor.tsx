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
                    label={gettext('Date time (AUTHORING-REACT)')}
                    onChange={(value) => {
                        this.props.onChange(value);
                    }}
                    value={(() => {
                        const {value} = this.props;
                        const parsedVal = value != null && (value.length > 0) ? new Date(value) : null;

                        return parsedVal;
                    })()}
                    disabled={this.props.config.readOnly}
                    width={this.props.config.width}
                />
            </Container>
        );
    }
}
