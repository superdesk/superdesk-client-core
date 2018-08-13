import React from 'react';
import PropTypes from 'prop-types';
import {createMarkUp} from '../../helpers';

export const headline:React.StatelessComponent<any> = (props) => {
    var headline = props.item.headline ? props.item.headline : props.item.type;

    return React.createElement(
        'span',
        {className: 'item-heading', key: 'headline',
            dangerouslySetInnerHTML: createMarkUp(headline)}
    );
};

headline.propTypes = {
    item: PropTypes.any,
};
