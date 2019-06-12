import React from 'react';
import PropTypes from 'prop-types';
import {IAlertComponentProps} from 'superdesk-api';
import {assertNever} from 'core/helpers/typescript-helpers';

function getClassName(alertType: IAlertComponentProps['type']) {
    switch (alertType) {
    case 'info':
        return 'sd-alert--primary';
    case 'error':
        return 'sd-alert--alert';
    case 'warning':
        return 'sd-alert--warning';
    default:
        assertNever(alertType);
    }
}

export const Alert: React.StatelessComponent<IAlertComponentProps> = (props) => {
    const className = [
        'sd-alert',
        props.hollow ? 'sd-alert--hollow' : '',
        getClassName(props.type),
    ].join(' ');

    return (
        <div className={className}>{props.children}</div>
    );
};

Alert.propTypes = {
    type: PropTypes.oneOf(['info', 'warning', 'error']),
    hollow: PropTypes.bool,
    children: PropTypes.node,
};
