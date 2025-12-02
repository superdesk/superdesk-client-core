import React from 'react';
import {IInputType} from '../interfaces/input-types';
import {assertNever} from 'core/helpers/typescript-helpers';

type AlertStyle = 'info' | 'warning' | 'error';

interface IAlertConfig {
    style?: AlertStyle;
}

function getAlertClassName(style: AlertStyle): string {
    switch (style) {
        case 'info':
            return 'alert-info';
        case 'warning':
            return 'alert-warning';
        case 'error':
            return 'alert-error';
        default:
            assertNever(style);
    }
}

export class AlertInput extends React.Component<IInputType<string>> {
    render() {
        // Alert field uses value prop directly, not from item[field]
        const message = this.props.value || '';
        const style: AlertStyle = (this.props.formField?.component_parameters as IAlertConfig)?.style || 'info';

        if (!message) {
            return null;
        }

        return (
            <div
                className={`alert ${getAlertClassName(style)}`}
                data-test-id={`gform-alert--${this.props.formField.field}`}
            >
                {message}
            </div>
        );
    }
}
