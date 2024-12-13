import React from 'react';
import {TypeIcon} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

class TypeComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const item = this.props.item;

        if (item.type == null) {
            return null;
        }

        return (
            <span>
                <TypeIcon type={item._type} highlight={item.highlight} contentProfileId={item.profile} />
            </span>
        );
    }
}

export const type = TypeComponent;
