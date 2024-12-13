import {gettext} from 'core/utils';
import {noop} from 'lodash';
import React from 'react';
import {IDateTimeFieldConfig, IDateTimeValueOperational, IPreviewComponentProps} from 'superdesk-api';
import {DateTimePicker} from 'superdesk-ui-framework/react';

type IProps = IPreviewComponentProps<IDateTimeValueOperational, IDateTimeFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        return (
            <DateTimePicker
                dateFormat="MM/DD/YYYY"
                label={gettext('Date time (AUTHORING-REACT)')}
                onChange={noop}
                preview={true}
                value={(() => {
                    const {value} = this.props;
                    const parsedVal = value != null && (value.length > 0) ? new Date(value) : null;

                    return parsedVal;
                })()}
                disabled={this.props.config.readOnly}
                width={this.props.config.width}
            />
        );
    }
}
