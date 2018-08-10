import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Content
 * @description Contents of a slide-in panel
 */
export const Content = ({children, first}) => (
    <div className="sd-slide-in-panel__content">
        <div className={classNames('sd-slide-in-panel__content-block',
            {'sd-slide-in-panel__content-block--first': first})}>
            {children}
        </div>
    </div>
);

Content.propTypes = {
    children: PropTypes.node,
    first: PropTypes.bool,
};

Content.defaultProps = {first: true};
