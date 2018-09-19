import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Label from './Label';

const Header: React.StatelessComponent<any> = (
    {text, onClose, children, className, noBorder, noPadding, centerText},
) => (
    <div className={classNames(
        'popup__menu-header',
        {
            'popup__menu-header--no-border': noBorder,
            'popup__menu-header--no-padding': noPadding,
        },
        className,
    )}>
        {text && (
            <Label text={text} centerText={centerText}>
                {onClose && (
                    <button className="popup__menu-close" onClick={onClose}>
                        <i className="icon-close-small" />
                    </button>
                )}
            </Label>
        )}
        {children}
    </div>
);

Header.propTypes = {
    text: PropTypes.string,
    onClose: PropTypes.func,
    children: PropTypes.node,
    className: PropTypes.string,
    noBorder: PropTypes.bool,
    noPadding: PropTypes.bool,
    centerText: PropTypes.bool,
};

export default Header;
