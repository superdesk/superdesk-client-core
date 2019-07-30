import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

export const copyright: React.StatelessComponent<IPropsItemListInfo> = ({item}) => {
    if (item.copyrightholder) {
        const title = item.usageterms || item.copyrightnotice || '';

        return (
            <small key="copyright"
                className="copyright container"
                title={title}
            >&copy; {item.copyrightholder}</small>
        );
    }

    return null;
};
