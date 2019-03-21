import React from 'react';
import PropTypes from 'prop-types';
import {MarkedDesksInfo} from '../index';

export function markedDesks(props) {
    return React.createElement(MarkedDesksInfo, angular.extend({
        key: 'markedDesks',
    }, props));
}

markedDesks['propTypes'] = {
    // item is passed through to MarkedDesksInfo directly via props
    // eslint-disable-next-line react/no-unused-prop-types
    item: PropTypes.any,
};
