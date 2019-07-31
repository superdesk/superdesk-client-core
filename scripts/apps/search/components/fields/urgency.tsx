import React from 'react';
import PropTypes from 'prop-types';
import {ItemUrgency} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

export const urgency: React.StatelessComponent<IPropsItemListInfo> = (props) => props.item.urgency ?
    React.createElement(
        ItemUrgency,
        angular.extend({key: 'urgency', svc: props.svc}, props.item),
    ) : null;

urgency.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
