import * as React from 'react';
import classNames from 'classnames';
import {Icon} from 'superdesk-ui-framework/react';

interface IProps {
    children?: React.ReactNode;
    title?: string;
    borderBottom?: boolean;
    darkBlueGrey?: boolean;
    borderB?: boolean;
    onClose?(): void;
}

export class PanelHeader extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'side-panel__header',
            {
                'side-panel__header--border-bottom': this.props.borderBottom,
                'side-panel__header--dark-blue-grey': this.props.darkBlueGrey,
                'side-panel__header--border-b': this.props.borderB,
            },
        );

        return (
            <div className={classes}>
                {this.props.onClose && (
                    <a className="icn-btn side-panel__close" onClick={this.props.onClose}>
                        <Icon name="close-small" />
                    </a>
                )}
                {!this.props.title ? null : (
                    <h3 className="side-panel__heading">{this.props.title}</h3>
                )}
                {this.props.children}
            </div>
        );
    }
}
