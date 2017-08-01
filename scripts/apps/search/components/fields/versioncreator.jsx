import React from 'react';
import PropTypes from 'prop-types';

export function versioncreator(props) {
    return React.createElement(
        'span',
        {className: 'version-creator', key: 'versioncreator'},
        props.versioncreator
    );
}

versioncreator.propTypes = {
    versioncreator: PropTypes.any
};
