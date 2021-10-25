import React from 'react';
import {ItemPriority} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

class PriorityComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        return props.item.priority
            ? React.createElement(
                ItemPriority,
                angular.extend({
                    key: 'priority',
                }, props.item),
            )
            : null;
    }
}

export const priority = PriorityComponent;
