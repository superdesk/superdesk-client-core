import React from 'react';
import {ItemPriority} from 'apps/search/components';

export function priority(props) {
    return props.item.priority ?
        React.createElement(
            ItemPriority,
            angular.extend({
                key: 'priority',
                svc: props.svc
            }, props.item)
        ) : null;
}

priority.propTypes = {
    svc: React.PropTypes.any.isRequired,
    item: React.PropTypes.any,
};
