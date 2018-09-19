import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

/**
 * @ngdoc react
 * @name Row
 * @description Component to encapsulate a component in Form row style
 */
export const Row: React.StatelessComponent<any> = ({children, flex, noPadding, halfWidth, className, enabled}) => (
    !enabled ?
        null :
        <div className={classNames(
            'form__row',
            {
                'form__row--flex': flex,
                'no-padding': noPadding,
                'form__row--half-width': halfWidth,
            },
            className,
        )}>
            {children}
        </div>
);

Row.propTypes = {
    children: PropTypes.node,
    flex: PropTypes.bool,
    noPadding: PropTypes.bool,
    className: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    halfWidth: PropTypes.bool,
    enabled: PropTypes.bool,
};

Row.defaultProps = {
    flex: false,
    noPadding: false,
    halfWidth: false,
    enabled: true,
};
