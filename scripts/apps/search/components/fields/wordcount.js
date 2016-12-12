import React from 'react';

export function wordcount(props) {
    return React.createElement(
        'span',
        {className: 'word-count', key: 'wordcount'},
        props.item.word_count
    );
}

wordcount.propTypes = {
    item: React.PropTypes.any,
};
