import React from 'react';
import PropTypes from 'prop-types';
import {IPropsItemListInfo} from '../ListItemInfo';

export const category: React.StatelessComponent<IPropsItemListInfo> = (props) => {
    const anpa = props.item.anpa_category || {};

    if (anpa.name == null) {
        return null;
    }

    return React.createElement('div', {className: 'category', key: 'category'}, anpa.name);
};

category.propTypes = {
    item: PropTypes.any,
};
