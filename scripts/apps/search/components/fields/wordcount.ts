import React from 'react';
import PropTypes from 'prop-types';

export function wordcount(props: any) {
    return React.createElement(
        'span',
        {className: 'word-count', key: 'wordcount'},
        props.item.word_count,
    );
}

wordcount['propTypes'] = {
    item: PropTypes.any,
};
