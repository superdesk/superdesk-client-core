import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

/**
 * Usage Terms field
 * @param {Object} props
 */
export const usageterms: React.StatelessComponent<IPropsItemListInfo> = ({item}) => {
    if (item.usageterms) {
        return (
            <small key="usageterms"
                className="usageterms container"
            >{item.usageterms}</small>
        );
    }

    return null;
};
