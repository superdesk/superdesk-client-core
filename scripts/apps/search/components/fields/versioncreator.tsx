import React from 'react';
import PropTypes from 'prop-types';

export const versioncreator: React.StatelessComponent<any> = (props) => React.createElement(
    'span',
    {className: 'version-creator', key: 'versioncreator'},
    props.versioncreator,
);

versioncreator.propTypes = {
    versioncreator: PropTypes.any,
};
