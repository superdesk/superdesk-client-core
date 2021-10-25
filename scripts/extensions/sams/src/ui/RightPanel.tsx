import * as React from 'react';

interface IProps {
    children?: React.ReactNode;
    open?: boolean;
}

export class RightPanel extends React.PureComponent<IProps> {
    render() {
        return (
            <div className={'sd-main-content-grid__preview' + (this.props.open ? ' open-preview' : '')}>
                {this.props.children}
            </div>
        );
    }
}
