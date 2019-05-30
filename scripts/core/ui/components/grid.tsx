import React from 'react';

interface IProps {
    columns: number;
    boxed?: boolean;
    children: React.ReactNodeArray;
}

export const Grid: React.StatelessComponent<IProps> = (props: IProps) => {
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
