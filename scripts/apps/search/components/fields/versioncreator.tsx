import React from 'react';
import PropTypes from 'prop-types';
import {IPropsItemListInfo} from '../ListItemInfo';

export const versioncreator: React.StatelessComponent<IPropsItemListInfo> = (props) => React.createElement(
    'span',
    {className: 'version-creator', key: 'versioncreator'},
    props.versioncreator,
);

versioncreator.propTypes = {
    versioncreator: PropTypes.any,
};
