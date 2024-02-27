import * as React from 'react';

interface IProps {
    ariaValue: string;
    refValue?(event): void;
    onClick(event: React.MouseEvent): void;
}

export class ActionButton extends React.PureComponent<IProps> {
    render() {
        return (
            <button
                className="sd-navbtn"
                aria-label={this.props.ariaValue}
                ref={this.props.refValue}
                onClick={this.props.onClick}
            >
                <i className="icon-dots-vertical" />
            </button>
        );
    }
}
