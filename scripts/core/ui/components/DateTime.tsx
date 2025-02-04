import React from 'react';
import {IPropsDateTime} from 'superdesk-api';
import {longFormat, shortFormat} from 'core/datetime/datetime';

export class DateTime extends React.PureComponent<IPropsDateTime> {
    render() {
        const {dateTime} = this.props;

        const dateShort = shortFormat(dateTime);
        const dateLong = longFormat(dateTime);
        const tooltip = this.props.tooltip == null ? dateLong : this.props.tooltip(dateLong, dateShort);

        return (
            <time title={tooltip}>{dateShort}</time>
        );
    }
}
