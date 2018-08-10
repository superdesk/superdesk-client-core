import React from 'react';
import PropTypes from 'prop-types';
import {ItemPriority} from '../index';

export const priority:React.StatelessComponent<any> = (props) => {
    return props.item.priority ?
        React.createElement(
            ItemPriority,
            angular.extend({
                key: 'priority',
                svc: props.svc,
            }, props.item)
        ) : null;
}

priority.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
