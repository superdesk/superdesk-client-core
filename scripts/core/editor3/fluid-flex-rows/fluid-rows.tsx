import React from 'react';

interface IProps {
    children: any;
    className?: string;
    onClick?: () => void;
}

export class FluidRows extends React.Component<IProps> {
    render() {
        return (
            <div onClick={this.props.onClick} className={this.props.className} style={{
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%',
                width: '100%',
            }}>
                {this.props.children}
            </div>
        );
    }
}
