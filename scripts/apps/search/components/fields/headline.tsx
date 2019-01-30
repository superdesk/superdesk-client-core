import React from 'react';
import PropTypes from 'prop-types';
import {createMarkUp} from '../../helpers';

export const headline: React.StatelessComponent<any> = (props) => {
    const _headline = typeof props.item.headline === 'string' && props.item.headline.length > 0
        ? props.item.headline
        : props.item.type;

    return React.createElement(
        'span',
        {className: 'item-heading', key: 'headline',
            dangerouslySetInnerHTML: createMarkUp(_headline)},
    );
};

headline.propTypes = {
    item: PropTypes.any,
};
