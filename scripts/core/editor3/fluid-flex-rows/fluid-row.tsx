import React from 'react';

interface IProps {
    className?: string;
    scrollable: boolean;
    children: any;
    'data-test-id'?: string;
}

export class FluidRow extends React.Component<IProps> {
    render() {
        return (
            <div
                className={this.props.className}
                data-test-id={this.props['data-test-id']}
                style={this.props.scrollable === true ? {overflow: 'auto'} : {}}
            >
                {this.props.children}
            </div>
        );
    }
}
