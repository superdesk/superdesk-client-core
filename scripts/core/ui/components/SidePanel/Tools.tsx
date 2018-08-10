import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {IconButton} from '../';


/**
 * @ngdoc react
 * @name Tools
 * @description Header tools of a side panel
 */
export const Tools:React.StatelessComponent<any> = ({className, tools, children, topTools}) => (
    <div
        className={classNames(
            {
                'side-panel__tools': !topTools,
                'side-panel__top-tools': topTools,
            },
            className
        )}
    >
        {tools.map((tool) => (
            <IconButton
                key={tool.icon}
                icon={tool.icon}
                onClick={tool.onClick}
                data-sd-tooltip={tool.title}
                data-flow="left"
            />
        ))}
        {children}
    </div>
);

Tools.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    tools: PropTypes.arrayOf(PropTypes.shape({
        icon: PropTypes.string,
        onClick: PropTypes.func,
        title: PropTypes.string,
    })).isRequired,
    topTools: PropTypes.bool,
};

Tools.defaultProps = {
    tools: [],
    topTools: false,
};
