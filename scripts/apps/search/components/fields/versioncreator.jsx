import React from 'react';

export function versioncreator(props) {
    return React.createElement(
        'span',
        {className: 'version-creator', key: 'versioncreator'},
        props.versioncreator
    );
}

versioncreator.propTypes = {
    versioncreator: React.PropTypes.any
};
