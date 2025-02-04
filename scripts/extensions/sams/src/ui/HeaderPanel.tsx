import * as React from 'react';

interface IProps {
    children?: React.ReactNode;
}

export class HeaderPanel extends React.PureComponent<IProps> {
    render() {
        return (
            <div className="sd-main-content-grid__header">
                {this.props.children}
            </div>
        );
    }
}
