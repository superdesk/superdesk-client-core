import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from '../index';

export const desk: React.StatelessComponent<any> = (props) => {
    if (!props.item.archived) {
        return React.createElement(ItemContainer, {
            item: props.item,
            desk: props.desk,
            key: 'desk',
        });
    }
};

desk.propTypes = {
    item: PropTypes.any,
    desk: PropTypes.any,
};
