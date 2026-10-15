import * as React from 'react';
import {Tooltip} from 'superdesk-ui-framework/react';

interface IProps {
    'aria-label': string;

    /**
     * Hover text. Passed through `Tooltip`'s render prop so the handlers land on the button and no
     * `display: contents` wrapper is added around it.
     */
    tooltip?: string;
    buttonRef?(event): void;
    onClick(event: React.MouseEvent): void;
}

export class MoreActionsButton extends React.PureComponent<IProps> {
    private renderButton(attributes?: React.HTMLAttributes<HTMLElement>) {
        return (
            <button
                {...attributes}
                className="sd-navbtn"
                aria-label={this.props['aria-label']}
                ref={this.props.buttonRef}
                onClick={this.props.onClick}
            >
                <i className="icon-dots-vertical" />
            </button>
        );
    }

    render() {
        if (this.props.tooltip == null) {
            return this.renderButton();
        }

        return (
            <Tooltip content={this.props.tooltip}>
                {({attributes}) => this.renderButton(attributes)}
            </Tooltip>
        );
    }
}
