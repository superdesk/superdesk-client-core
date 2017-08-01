import React from 'react';
import PropTypes from 'prop-types';
import {MarkedDesksInfo} from 'apps/search/components';

export function markedDesks(props) {
    return React.createElement(MarkedDesksInfo, angular.extend({
        key: 'markedDesks'
    }, props));
}

markedDesks.propTypes = {
    item: PropTypes.any,
};
