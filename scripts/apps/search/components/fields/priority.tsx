import React from 'react';
import PropTypes from 'prop-types';
import {ItemPriority} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

export const priority: React.StatelessComponent<IPropsItemListInfo> = (props) => props.item.priority ?
    React.createElement(
        ItemPriority,
        angular.extend({
            key: 'priority',
        }, props.item),
    ) : null;

priority.propTypes = {
    item: PropTypes.any,
};
