import React from 'react';
import ng from 'core/services/ng';

interface IProps {
    date: any;
    key?: string;
}

export class TimeElem extends React.Component<IProps> {
    datetime: any;

    constructor(props: IProps) {
        super(props);

        this.datetime = ng.get('datetime');
    }
    render() {
        const {date, key} = this.props;

        return (
            <time key={key} title={this.datetime.longFormat(date)}>{this.datetime.shortFormat(date)}</time>
        );
    }
}
