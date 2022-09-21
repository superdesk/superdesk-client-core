import React from 'react';
import ng from 'core/services/ng';
import {IPropsDateTime} from 'superdesk-api';

export class DateTime extends React.PureComponent<IPropsDateTime> {
    render() {
        const datetimeService = ng.get('datetime');
        const {dateTime} = this.props;

        const dateShort = datetimeService.shortFormat(dateTime);
        const dateLong = datetimeService.longFormat(dateTime);
        const tooltip = this.props.tooltip == null ? dateLong : this.props.tooltip(dateLong, dateShort);

        return (
            <time title={tooltip}>{dateShort}</time>
        );
    }
}
