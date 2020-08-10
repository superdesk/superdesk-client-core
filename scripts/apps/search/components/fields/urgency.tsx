import React from 'react';
import PropTypes from 'prop-types';
import {ItemUrgency} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

export const urgency: React.StatelessComponent<IPropsItemListInfo> = (props) => props.item.urgency ?
    React.createElement(
        ItemUrgency,
        angular.extend({key: 'urgency'}, props.item),
    ) : null;

urgency.propTypes = {
    item: PropTypes.any,
};
