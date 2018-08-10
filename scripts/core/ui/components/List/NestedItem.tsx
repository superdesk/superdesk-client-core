import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name NestedItem
 * @description Component to have two items nested
 */
export const NestedItem:React.StatelessComponent<any> = ({collapsed, expanded, parentItem, nestedChildren}) => (
    <div className={classNames(
        'sd-list-item-nested',
        {'sd-list-item-nested--collapsed': collapsed},
        {'sd-list-item-nested--expanded': expanded}
    )}
    >
        {parentItem}
        <div className="sd-list-item-nested__childs sd-shadow--z1">
            {nestedChildren}
        </div>
    </div>
);

NestedItem.propTypes = {
    collapsed: PropTypes.bool,
    expanded: PropTypes.bool,
    parentItem: PropTypes.element.isRequired,
    nestedChildren: PropTypes.arrayOf(PropTypes.node),
};

NestedItem.defaultProps = {
    collapsed: true,
    expanded: false,
};
