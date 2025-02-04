import * as React from 'react';

export interface IMainPanelProps {
    children?: React.ReactNode;
    className?: string;
    onScroll?(event: React.UIEvent<HTMLDivElement>): void;

    // ... other props
    style?: React.CSSProperties;
}

export class MainPanel extends React.PureComponent<IMainPanelProps> {
    render() {
        const className = !this.props.className ?
            'sd-main-content-grid__content' :
            `sd-main-content-grid__content ${this.props.className}`;

        return (
            <div className={className} onScroll={this.props.onScroll} style={this.props.style}>
                {this.props.children}
            </div>
        );
    }
}
