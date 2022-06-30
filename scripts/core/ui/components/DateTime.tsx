import React from 'react';
import ng from 'core/services/ng';
import {IPropsDateTime} from 'superdesk-api';

export class DateTime extends React.PureComponent<IPropsDateTime> {
    render() {
        const datetimeService = ng.get('datetime');
        const {dateTime} = this.props;

        return (
            <time title={datetimeService.longFormat(dateTime)}>{datetimeService.shortFormat(dateTime)}</time>
        );
    }
}
