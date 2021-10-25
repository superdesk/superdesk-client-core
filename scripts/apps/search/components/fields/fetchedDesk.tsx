import React from 'react';
import {FetchedDesksInfo} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

class FetchedDeskComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        if (props.item.archived) {
            return React.createElement(FetchedDesksInfo, {
                item: props.item,
                key: 'desk',
            });
        } else {
            return null;
        }
    }
}

export const fetchedDesk = FetchedDeskComponent;
