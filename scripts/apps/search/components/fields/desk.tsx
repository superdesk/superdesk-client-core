import React from 'react';
import {ItemContainer} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

class DeskComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        if (props.item.archived) {
            return null;
        }

        return React.createElement(ItemContainer, {
            item: props.item,
            desk: props.desk,
            key: 'desk',
        });
    }
}

export const desk = DeskComponent;
