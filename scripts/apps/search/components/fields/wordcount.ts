import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class WordCountComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        return React.createElement(
            'span',
            {className: 'word-count', key: 'wordcount'},
            props.item.word_count,
        );
    }
}

export const wordcount = WordCountComponent;
