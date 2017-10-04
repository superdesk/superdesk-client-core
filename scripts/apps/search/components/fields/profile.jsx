import React from 'react';
import PropTypes from 'prop-types';

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
    item: PropTypes.any,
    profilesById: PropTypes.any,
};
