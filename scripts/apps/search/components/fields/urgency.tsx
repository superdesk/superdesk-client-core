import React from 'react';
import {ItemUrgency} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

class UrgencyComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        return props.item.urgency
            ? React.createElement(
                ItemUrgency,
                angular.extend({key: 'urgency'}, props.item),
            )
            : null;
    }
}

export const urgency = UrgencyComponent;
