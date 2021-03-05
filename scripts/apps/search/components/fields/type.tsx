import React from 'react';
import {TypeIcon} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

class TypeComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        if (props.item.type == null) {
            return null;
        }

        const {_type, highlight} = props.item;

        return (
            <span>
                <TypeIcon type={_type} highlight={highlight} />
            </span>
        );
    }
}

export const type = TypeComponent;
