import React from 'react';
import PropTypes from 'prop-types';
import {IPropsItemListInfo} from '../ListItemInfo';

export const profile: React.StatelessComponent<IPropsItemListInfo> = (props) => {
    if (props.item.profile) {
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
};

profile.propTypes = {
    item: PropTypes.any,
    profilesById: PropTypes.any,
};
