import React from 'react';
import {TimeElem} from '../TimeElem';
import {IPropsItemListInfo} from '../ListItemInfo';

class VersionCreatedComponent extends React.Component<Pick<IPropsItemListInfo, 'item'>> {
    render() {
        const props = this.props;

        return (
            <TimeElem key={'versioncreated'} date={props.item.versioncreated} />
        );
    }
}

export const versioncreated = VersionCreatedComponent;
