import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class VersionCreatorComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        return React.createElement(
            'span',
            {className: 'version-creator', key: 'versioncreator'},
            props.versioncreator,
        );
    }
}

export const versioncreator = VersionCreatorComponent;
