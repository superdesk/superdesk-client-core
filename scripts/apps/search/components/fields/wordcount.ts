import React from 'react';
import PropTypes from 'prop-types';
import {IPropsItemListInfo} from '../ListItemInfo';

export const wordcount: React.StatelessComponent<IPropsItemListInfo> = (props) => {
    return React.createElement(
        'span',
        {className: 'word-count', key: 'wordcount'},
        props.item.word_count,
    );
};

wordcount['propTypes'] = {
    item: PropTypes.any,
};
