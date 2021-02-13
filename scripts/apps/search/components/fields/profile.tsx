import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class ProfileComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        if (props.item.profile && props.profilesById?.[props.item.profile]) {
            return React.createElement(
                'div',
                {className: 'profile-label profile-label--' + props.item.profile, key: 'profile'},
                props.profilesById[props.item.profile] ?
                    props.profilesById[props.item.profile].label :
                    props.item.profile,
            );
        } else {
            return null;
        }
    }
}

export const profile = ProfileComponent;
