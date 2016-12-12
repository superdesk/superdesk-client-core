import React from 'react';
import {ItemContainer} from 'apps/search/components';

export function desk(props) {
    if (!props.item.archived) {
        return React.createElement(ItemContainer, {
            item: props.item,
            desk: props.desk,
            key: 'desk',
            svc: props.svc
        });
    }
}

desk.propTypes = {
    svc: React.PropTypes.object.isRequired,
    item: React.PropTypes.any,
    desk: React.PropTypes.any,
};
