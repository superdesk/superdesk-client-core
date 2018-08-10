import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name ContentBlockInner
 * @description Inner Component to hold content block of a side panel
 */
export const ContentBlockInner = ({children, className, right, grow}) => (
    <div
        className={classNames(
            'side-panel__content-block-inner',
            className,
            {
                'side-panel__content-block-inner--right': right,
                'side-panel__content-block-inner--grow': grow,
            }
        )}
    >
        {children}
    </div>
);

ContentBlockInner.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    right: PropTypes.bool,
    grow: PropTypes.bool,
};

ContentBlockInner.defaultProps = {
    right: false,
    grow: false,
};