import React from 'react';
import {IAlertComponentProps} from 'superdesk-api';
import {assertNever} from 'core/helpers/typescript-helpers';
import {Button} from 'superdesk-ui-framework/react';

function getTypeClassName(alertType: IAlertComponentProps['type']) {
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

function getSizeClassName(alertType: IAlertComponentProps['size']) {
    switch (alertType) {
    case 'small':
        return 'sd-alert--small';
    default:
        assertNever(alertType);
    }
}

export class Alert extends React.PureComponent<IAlertComponentProps> {
    render() {
        const classNames = [
            'sd-alert',
            this.props.hollow ? 'sd-alert--hollow' : '',
            getTypeClassName(this.props.type),
            'alert-extended',
        ];

        if (this.props.size != null) {
            classNames.push(getSizeClassName(this.props.size));
        }

        return (
            <div className={classNames.join(' ')}>
                <div>
                    {
                        this.props.title != null && (
                            <strong className="alert-extended--title">{this.props.title}</strong>
                        )
                    }

                    <p className="alert-extended--message">{this.props.message}</p>
                </div>

                {
                    this.props.actions != null && (
                        <div>
                            {
                                this.props.actions.map((action) => (
                                    <Button
                                        key={action.label}
                                        text={action.label}
                                        icon={action.icon}
                                        iconOnly={action.icon != null}
                                        onClick={() => {
                                            action.onClick();
                                        }}
                                        size="small"
                                    />
                                ))
                            }
                        </div>
                    )
                }
            </div>
        );
    }
}
