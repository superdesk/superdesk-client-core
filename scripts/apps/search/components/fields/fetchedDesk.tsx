import React from 'react';
import PropTypes from 'prop-types';
import {FetchedDesksInfo} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

export const fetchedDesk: React.StatelessComponent<IPropsItemListInfo> = (props) => {
    if (props.item.archived) {
        return React.createElement(FetchedDesksInfo, {
            item: props.item,
            key: 'desk',
        });
    } else {
        return null;
    }
};

fetchedDesk.propTypes = {
    item: PropTypes.any,
};
