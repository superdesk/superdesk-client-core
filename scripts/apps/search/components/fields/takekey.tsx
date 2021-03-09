import React from 'react';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';

class TakeKeyComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        if (props.item.anpa_take_key) {
            return React.createElement('span', {className: 'takekey', key: 'takekey'},
                gettext(props.item.anpa_take_key));
        } else {
            return null;
        }
    }
}

export const takekey = TakeKeyComponent;
