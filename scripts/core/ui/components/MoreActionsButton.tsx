import * as React from 'react';

interface IProps {
    'aria-label': string;
    buttonRef?(event): void;
    onClick(event: React.MouseEvent): void;
}

export class MoreActionsButton extends React.PureComponent<IProps> {
    render() {
        return (
            <button
                className="sd-navbtn"
                aria-label={this.props['aria-label']}
                ref={this.props.buttonRef}
                onClick={this.props.onClick}
            >
                <i className="icon-dots-vertical" />
            </button>
        );
    }
}
