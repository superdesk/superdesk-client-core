import React from 'react';
import {MarkedDesksInfo} from 'apps/search/components';

export function markedDesks(props) {
    return React.createElement(MarkedDesksInfo, angular.extend({
        key: 'markedDesks'
    }, props));
}

markedDesks.propTypes = {
    item: React.PropTypes.any,
};
