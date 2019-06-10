import React from 'react';
import {IPropsComponentAlert} from 'superdesk-api';

const CLASSNAMES = {
    info: 'sd-alert--primary',
    warning: 'sd-alert--warning',
    error: 'sd-alert--alert',
};

export const Alert: React.StatelessComponent<IPropsComponentAlert> = (props) => {
    const className = [
        'sd-alert',
        props.hollow ? 'sd-alert--hollow' : '',
        CLASSNAMES[props.type],
    ].join(' ');

    return (
        <div className={className}>{props.children}</div>
    );
};
