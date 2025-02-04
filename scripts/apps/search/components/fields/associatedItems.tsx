import React from 'react';
import {isEmpty} from 'lodash';
import {AssociatedItemsList} from './AssociatedItemsList';
import {IPropsItemListInfo} from '../ListItemInfo';

class AssociatedItemsComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const {item} = this.props;

        return (
            isEmpty(item.associations) ? null : <AssociatedItemsList key="associatedItems" item={item} />
        );
    }
}

export const associatedItems = AssociatedItemsComponent;
