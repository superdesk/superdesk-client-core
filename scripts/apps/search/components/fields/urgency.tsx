import React from 'react';
import PropTypes from 'prop-types';
import {ItemUrgency} from '../index';

export const urgency: React.StatelessComponent<any> = (props) => props.item.urgency ?
    React.createElement(
        ItemUrgency,
        angular.extend({key: 'urgency', svc: props.svc}, props.item),
    ) : null;

urgency.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
