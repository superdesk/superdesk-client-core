import React from 'react';
import {get} from 'lodash';
import {IPropsItemListInfo} from '../ListItemInfo';

export const language: React.StatelessComponent<IPropsItemListInfo> = ({item}) => {
    if (item.language == null) {
        return null;
    }

    return (
        <span key="language" className="language-label">
            {get(item, 'language')}
        </span>
    );
};
