import React from 'react';
import PropTypes from 'prop-types';
import {IPropsComponentGrid} from 'superdesk-api';

export const Grid: React.StatelessComponent<IPropsComponentGrid> = (props) => {
    const className = [
        'flex-grid',
        'flex-grid--wrap-items',
        props.boxed ? 'flex-grid--boxed' : '',
        `flex-grid--small-${props.columns}`,
    ].join(' ');

    return (
        <div className={className}>
            {props.children.map((node, index) => (
                <div key={index} className="flex-grid__item">{node}</div>
            ))}
        </div>
    );
};

Grid.propTypes = {
    boxed: PropTypes.bool,
    columns: PropTypes.number.isRequired,
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
};
