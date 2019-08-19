import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

export const desk: React.StatelessComponent<IPropsItemListInfo> = (props) => {
    if (props.item.archived) {
        return null;
    }

    return React.createElement(ItemContainer, {
        item: props.item,
        desk: props.desk,
        key: 'desk',
    });
};

desk.propTypes = {
    item: PropTypes.any,
    desk: PropTypes.any,
};
