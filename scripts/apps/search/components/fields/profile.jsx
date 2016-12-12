import React from 'react';

export function profile(props) {
    if (props.item.profile) {
        return React.createElement(
            'div',
            {className: 'profile-label profile-label--' + props.item.profile, key: 'profile'},
            props.profilesById[props.item.profile] ?
                props.profilesById[props.item.profile].label :
                props.item.profile
        );
    }
}

profile.propTypes = {
    item: React.PropTypes.any,
    profilesById: React.PropTypes.any,
};
