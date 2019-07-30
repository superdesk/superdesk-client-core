import React from 'react';
import {connectServices} from 'core/helpers/ReactRenderAsync';

interface IProps {
    date: any;
    key?: string;
    datetime?: any;
}

class TimeElementComponent extends React.Component<IProps> {
    render() {
        const {datetime, date, key} = this.props;

        return (
            <time key={key} title={datetime.longFormat(date)}>{datetime.shortFormat(date)}</time>
        );
    }
}

export const TimeElem = connectServices<IProps>(TimeElementComponent, ['datetime']);
