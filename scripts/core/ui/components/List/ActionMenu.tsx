import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name ActionMenu
 * @description Component to encapsulate three-dot action menu in list a item
 */
export const ActionMenu: React.StatelessComponent<any> = ({children, row}) => (
    <div className={classNames('sd-list-item__action-menu',
        {'sd-list-item__action-menu--direction-row': row})}>
        {children}
    </div>
);

ActionMenu.propTypes = {
    children: PropTypes.node.isRequired,
    row: PropTypes.bool,
};

ActionMenu.defaultProps = {row: true};
