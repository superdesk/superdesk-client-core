import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Menu
 * @description Menu Component in a popup
 */
const Menu:React.StatelessComponent<any> = ({children, noPadding}) => (
    <div className={classNames(
        'popup__menu',
        {'popup__menu--no-padding': noPadding}
    )}>
        {children}
    </div>
);

Menu.propTypes = {
    children: PropTypes.node.isRequired,
    noPadding: PropTypes.bool,
};

Menu.defaultProps = {noPadding: false};

export default Menu;
