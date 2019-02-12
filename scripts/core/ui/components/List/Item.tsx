import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Item
 * @description Component to encapsulate a list item
 */
export const Item: React.StatelessComponent<any> = (
    {children, noBg, noHover, shadow, activated, className, onClick, margin},
) => (
    <div className={classNames(
        className,
        'sd-list-item',
        {'sd-list-item--no-bg': noBg},
        {'sd-list-item--no-hover': noHover},
        {'sd-list-item--margin': margin},
        shadow ? `sd-shadow--z${shadow}` : null,
        {'sd-list-item--activated': activated},
    )}
    onClick={onClick}
    >
        {children}
    </div>
);

Item.propTypes = {
    children: PropTypes.node.isRequired,
    noBg: PropTypes.bool,
    noHover: PropTypes.bool,
    shadow: PropTypes.oneOf([1, 2, 3, 4]),
    activated: PropTypes.bool,
    className: PropTypes.string,
    onClick: PropTypes.func,
    margin: PropTypes.bool,
};

Item.defaultProps = {
    noBg: false,
    noHover: false,
    margin: false,
};

export const ListItemRow = ({children}) => (
    <div className="sd-list-item__row">{children}</div>
);

export const ListItemColumn = ({children, grow = false, border = false, title = ''}) => (
    <div className={classNames(
        'sd-list-item__column',
        {
            'sd-list-item__column--grow': grow,
            'sd-list-item__column--border': border,
        })}
        title={title}>
        {children}
    </div>
);