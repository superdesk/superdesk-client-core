import React from 'react';
import PropTypes from 'prop-types';
import {ItemUrgency} from 'apps/search/components';

export function urgency(props) {
    return props.item.urgency ?
        React.createElement(
            ItemUrgency,
            angular.extend({key: 'urgency', svc: props.svc}, props.item)
        ) : null;
}

urgency.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
