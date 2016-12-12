import React from 'react';
import {createMarkUp} from 'apps/search/helpers';

export function headline(props) {
    var headline = props.item.headline ? props.item.headline : props.item.type;

    return React.createElement(
        'span',
        {className: 'item-heading', key: 'headline',
            dangerouslySetInnerHTML: createMarkUp(headline)}
    );
}

headline.propTypes = {
    item: React.PropTypes.any,
};
