import * as React from 'react';

interface IProps {
    children?: React.ReactNode;
}

export class PanelContent extends React.PureComponent<IProps> {
    render() {
        return (
            <div className="side-panel__content">
                {this.props.children}
            </div>
        );
    }
}
