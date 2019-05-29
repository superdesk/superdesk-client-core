import React from 'react';

interface IProps {
    type: 'info' | 'warning' | 'error';
    hollow?: boolean;
    children: React.ReactNode;
}

const CLASSNAMES = {
    info: 'sd-alert--primary',
    warning: 'sd-alert--warning',
    error: 'sd-alert--alert',
};

export function Alert(props: IProps) {
    const className = [
        'sd-alert',
        props.hollow ? 'sd-alert--hollow' : '',
        CLASSNAMES[props.type],
    ].join(' ');

    return (
        <div className={className}>{props.children}</div>
    );
}
