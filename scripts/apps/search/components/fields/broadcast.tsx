import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class BroadcastComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        const _broadcast = props.item.broadcast || {};

        if (_broadcast.status == null) {
            return null;
        }

        return React.createElement(
            'span',
            {className: 'broadcast-status', title: _broadcast.status, key: 'broadcast'},
            '!',
        );
    }
}

export const broadcast = BroadcastComponent;
