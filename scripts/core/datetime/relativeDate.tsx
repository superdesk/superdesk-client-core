import React from 'react';
import moment from 'moment';
import {reactToAngular1} from 'superdesk-ui-framework';

interface IProps {
    datetime: string;
}

export class RelativeDate extends React.Component<IProps> {
    static propTypes: any;

    render() {
        const date = moment.utc(this.props.datetime);

        date.local(); // switch to local time zone

        const datetimeIso = date.toISOString();
        const title = date.format('LLLL');
        const reldate = date.fromNow();

        return (
            <time dateTime={datetimeIso} title={title}>{reldate}</time>
        );
    }
}

angular.module('superdesk.core.datetime.relativeDate', [])
    .component('sdRelativeDate', reactToAngular1(RelativeDate, ['datetime']));
