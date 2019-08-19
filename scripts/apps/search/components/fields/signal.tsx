import React from 'react';
import PropTypes from 'prop-types';
import {IPropsItemListInfo} from '../ListItemInfo';

export const signal: React.StatelessComponent<IPropsItemListInfo> = (props) => {
    if (props.item.signal) {
        return React.createElement('span', {className: 'signal', key: 'signal'}, props.item.signal);
    } else {
        return null;
    }
};

signal.propTypes = {
    item: PropTypes.any,
};
