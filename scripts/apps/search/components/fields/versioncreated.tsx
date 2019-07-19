import React from 'react';
import {TimeElem} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

export const versioncreated: React.StatelessComponent<Pick<IPropsItemListInfo, 'item'>> = (props) => (
    <TimeElem key={'versioncreated'} date={props.item.versioncreated} />
);
