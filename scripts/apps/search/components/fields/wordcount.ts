import React from 'react';

interface IProps {
    item: any;
}
export class wordcount extends React.Component<IProps> {
    render() {
        return React.createElement(
            'span',
            {className: 'word-count', key: 'wordcount'},
            this.props.item.word_count,
        );
    }
}
