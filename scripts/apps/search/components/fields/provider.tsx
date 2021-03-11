import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class ProviderComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        let _provider = props.ingestProvider ? props.ingestProvider.source : '';

        if (props.item.source) {
            _provider = props.item.source;
        }
        if (_provider) {
            return React.createElement('span', {className: 'provider', key: 'provider'}, _provider);
        } else {
            return null;
        }
    }
}

export const provider = ProviderComponent;
