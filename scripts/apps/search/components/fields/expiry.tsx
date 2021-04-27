import React from 'react';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';
import ng from 'core/services/ng';

class ExpiryComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;
        const datetime = ng.get('datetime');

        if (props.item.is_spiked) {
            return React.createElement(
                'div',
                {className: 'expires', key: 'expiry'},
                gettext('expires') + ' ' + datetime.shortFormat(props.item.expiry),
            );
        } else {
            return null;
        }
    }
}

export const expiry = ExpiryComponent;
