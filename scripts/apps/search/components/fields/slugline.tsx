import React from 'react';
import PropTypes from 'prop-types';
import {createMarkUp} from '../../helpers';

export function slugline(props) {
    if (props.item.slugline) {
        return React.createElement(
            'span',
            {className: 'field--slugline', key: 'slugline',
                dangerouslySetInnerHTML: createMarkUp(props.item.slugline)},

        );
    } else {
        return null;
    }
}

slugline['propTypes'] = {
    item: PropTypes.any,

};
