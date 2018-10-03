import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';
import {reactToAngular1} from 'superdesk-ui-framework';

interface IRelativeDate {
    datetime: string;
}

export class RelativeDate extends React.Component<IRelativeDate, any> {
    static propTypes: any;

    render() {
        const date = moment.utc(this.props.datetime);

        console.log('wops', this.props);

        date.local(); // switch to local time zone

        const datetimeIso = date.toISOString();
        const title = date.format('LLLL');
        const reldate = date.fromNow();

        return (
            <time dateTime={datetimeIso} title={title}>{reldate}</time>
        );
    }
}

RelativeDate.propTypes = {
    datetime: PropTypes.any,
};

angular.module('superdesk.core.datetime.relativeDate', [])
    .component('relativeDate', reactToAngular1(RelativeDate));
