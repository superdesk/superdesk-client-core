import React from 'react';
import PropTypes from 'prop-types';
import {createMarkUp} from '../../helpers';

export function slugline(props) {
    if (props.item.slugline) {
        return React.createElement(
            'span',
            {className: 'keyword', key: 'slugline',
                dangerouslySetInnerHTML: createMarkUp(props.item.slugline)}
        );
    }
}

slugline.propTypes = {
    item: PropTypes.any,
};
