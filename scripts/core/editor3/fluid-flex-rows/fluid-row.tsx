import React from 'react';

interface IProps {
    className?: string;
    scrollable: boolean;
    children: any;
}

export class FluidRow extends React.Component<IProps> {
    render() {
        return (
            <div className={this.props.className} style={this.props.scrollable === true ? {overflow: 'auto'} : {}}>
                {this.props.children}
            </div>
        );
    }
}
