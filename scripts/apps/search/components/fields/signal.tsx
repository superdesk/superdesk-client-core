import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class SignalComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        if (props.item.signal) {
            return React.createElement('span', {className: 'signal', key: 'signal'}, props.item.signal);
        } else {
            return null;
        }
    }
}

export const signal = SignalComponent;
