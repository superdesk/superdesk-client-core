import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class CategoryComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        const anpa = props.item.anpa_category || {};

        if (anpa.name == null) {
            return null;
        }

        return React.createElement('div', {className: 'category', key: 'category'}, anpa.name);
    }
}

export const category = CategoryComponent;
