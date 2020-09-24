import React from 'react';
import ng from 'core/services/ng';

interface IProps {
    date: any;
}

export class TimeElem extends React.Component<IProps> {
    render() {
        const {date} = this.props;

        const datetime = ng.get('datetime');

        return (
            <time title={datetime.longFormat(date)}>{datetime.shortFormat(date)}</time>
        );
    }
}
