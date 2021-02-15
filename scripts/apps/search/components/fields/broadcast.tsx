import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

export class BroadcastFieldComponent extends React.Component<Pick<IPropsItemListInfo, 'item'>> {
    render() {
        const props = this.props;

        const status = props.item?.broadcast?.status;

        if (status == null) {
            return null;
        }

        return React.createElement(
            'span',
            {className: 'broadcast-status', title: status, key: 'broadcast'},
            '!',
        );
    }
}

export const broadcast = BroadcastFieldComponent;
