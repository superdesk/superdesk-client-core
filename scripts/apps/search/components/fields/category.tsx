import React from 'react';
import PropTypes from 'prop-types';

export const category:React.StatelessComponent<any> = (props) => {
    var anpa = props.item.anpa_category || {};

    if (anpa.name) {
        return React.createElement('div', {className: 'category', key: 'category'}, anpa.name);
    }
}

category.propTypes = {
    item: PropTypes.any,
};
