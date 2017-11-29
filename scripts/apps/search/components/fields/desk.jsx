import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from '../index';

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
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
    desk: PropTypes.any,
};
