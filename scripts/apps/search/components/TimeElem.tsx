import React from 'react';
import ng from 'core/services/ng';

interface IProps {
    date: any;
}

export class TimeElem extends React.Component<IProps> {
    datetime: any;

    constructor(props: IProps) {
        super(props);

        this.datetime = ng.get('datetime');
    }
    render() {
        const {date} = this.props;

        return (
            <time title={this.datetime.longFormat(date)}>{this.datetime.shortFormat(date)}</time>
        );
    }
}
